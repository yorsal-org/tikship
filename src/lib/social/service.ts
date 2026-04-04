/**
 * Social Module Service
 * Comments, Replies, Likes, and Settings business logic
 */
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'
import { socialSettingsService } from '@/lib/settings/service'
import type {
  Comment,
  Reply,
  Like,
  CommentStatus,
  TargetType,
} from '@/types/social'
import type { SocialSettingsValues } from '@/types/settings'

// Re-export for backward compatibility
export { filterSensitiveWords } from '@/lib/settings/service'
import { filterSensitiveWords } from '@/lib/settings/service' // Used in this file

/**
 * Get sensitive words from settings (comma-separated string)
 */
export async function getSensitiveWords(): Promise<string[]> {
  return socialSettingsService.getSensitiveWords()
}

/**
 * Get or create default social settings
 */
export async function getSettings(): Promise<SocialSettingsValues> {
  return socialSettingsService.get()
}

/**
 * Update social settings
 */
export async function updateSettings(data: Partial<SocialSettingsValues>): Promise<void> {
  await socialSettingsService.update(data)
}

// ============ Comment Service ============

/**
 * Create a new comment
 */
export async function createComment({
  userId,
  targetType,
  targetId,
  content,
  ipAddress,
  userAgent,
}: {
  userId: string
  targetType: TargetType
  targetId: string
  content: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<Comment> {
  // Get settings and sensitive words
  const [settings, sensitiveWords] = await Promise.all([
    getSettings(),
    getSensitiveWords(),
  ])

  // Filter sensitive words
  const filteredContent = filterSensitiveWords(content, sensitiveWords)

  // Determine initial status
  const status: CommentStatus = settings.commentRequireApproval ? 'PENDING' : 'APPROVED'

  // Extract IP and UserAgent if not provided
  let finalIpAddress = ipAddress
  let finalUserAgent = userAgent

  if (!finalIpAddress || !finalUserAgent) {
    try {
      const headersList = await headers()
      if (!finalIpAddress) {
        finalIpAddress = headersList.get('x-forwarded-for') || null
      }
      if (!finalUserAgent) {
        finalUserAgent = headersList.get('user-agent') || null
      }
    } catch {
      // Headers not available in this context
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: filteredContent,
      userId,
      targetType,
      targetId,
      status,
      ipAddress: finalIpAddress,
      userAgent: finalUserAgent,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  // Cast targetType to TargetType since Prisma returns string
  return {
    ...comment,
    targetType: comment.targetType as TargetType,
  } as Comment
}

/**
 * Create a reply to a comment
 */
export async function createReply({
  userId,
  commentId,
  content,
  ipAddress,
  userAgent,
}: {
  userId: string
  commentId: string
  content: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<Reply> {
  // Get settings and sensitive words
  const [settings, sensitiveWords] = await Promise.all([
    getSettings(),
    getSensitiveWords(),
  ])

  // Filter sensitive words
  const filteredContent = filterSensitiveWords(content, sensitiveWords)

  // Determine initial status
  const status: CommentStatus = settings.replyRequireApproval ? 'PENDING' : 'APPROVED'

  // Extract IP and UserAgent if not provided
  let finalIpAddress = ipAddress
  let finalUserAgent = userAgent

  if (!finalIpAddress || !finalUserAgent) {
    try {
      const headersList = await headers()
      if (!finalIpAddress) {
        finalIpAddress = headersList.get('x-forwarded-for') || null
      }
      if (!finalUserAgent) {
        finalUserAgent = headersList.get('user-agent') || null
      }
    } catch {
      // Headers not available in this context
    }
  }

  const reply = await prisma.reply.create({
    data: {
      content: filteredContent,
      userId,
      commentId,
      status,
      ipAddress: finalIpAddress,
      userAgent: finalUserAgent,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  return reply as Reply
}

/**
 * Get public comments for a target (only approved)
 */
export async function getPublicComments({
  targetType,
  targetId,
  page = 1,
  pageSize = 20,
}: {
  targetType: TargetType
  targetId: string
  page?: number
  pageSize?: number
}) {
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        targetType,
        targetId,
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comment.count({
      where: {
        targetType,
        targetId,
        status: 'APPROVED',
      },
    }),
  ])

  return {
    comments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get all comments for admin (with all statuses)
 */
export async function getAdminComments({
  status,
  targetType,
  search,
  page = 1,
  pageSize = 20,
}: {
  status?: CommentStatus
  targetType?: TargetType
  search?: string
  page?: number
  pageSize?: number
}) {
  const where: {
    status?: CommentStatus
    targetType?: TargetType
    OR?: Array<{ content: { contains: string; mode: 'insensitive' } }>
  } = {}

  if (status) where.status = status
  if (targetType) where.targetType = targetType
  if (search) {
    where.OR = [{ content: { contains: search, mode: 'insensitive' } }]
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comment.count({ where }),
  ])

  // Add repliesCount to each comment
  const commentsWithRepliesCount = comments.map(comment => ({
    ...comment,
    repliesCount: comment._count.replies,
  }))

  return {
    comments: commentsWithRepliesCount,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get single comment with replies for admin
 */
export async function getAdminComment(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!comment) return null

  return {
    ...comment,
    _count: {
      replies: comment.replies.length,
    },
  }
}

/**
 * Update comment status
 */
export async function updateCommentStatus(
  commentId: string,
  status: CommentStatus
): Promise<Comment> {
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  return comment as Comment
}

/**
 * Update reply status
 */
export async function updateReplyStatus(
  replyId: string,
  status: CommentStatus
): Promise<Reply> {
  const reply = await prisma.reply.update({
    where: { id: replyId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  return reply as Reply
}

/**
 * Delete a comment (also deletes all replies)
 */
export async function deleteComment(commentId: string): Promise<void> {
  await prisma.comment.delete({
    where: { id: commentId },
  })
}

/**
 * Delete a reply
 */
export async function deleteReply(replyId: string): Promise<void> {
  await prisma.reply.delete({
    where: { id: replyId },
  })
}

/**
 * Get all replies for admin (with all statuses)
 */
export async function getAdminReplies({
  status,
  search,
  page = 1,
  pageSize = 20,
}: {
  status?: CommentStatus
  search?: string
  page?: number
  pageSize?: number
}) {
  const where: {
    status?: CommentStatus
    OR?: Array<{ content: { contains: string; mode: 'insensitive' } }>
  } = {}

  if (status) where.status = status
  if (search) {
    where.OR = [{ content: { contains: search, mode: 'insensitive' } }]
  }

  const [replies, total] = await Promise.all([
    prisma.reply.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reply.count({ where }),
  ])

  return {
    replies,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ============ Comment Stats ============

/**
 * Get comment statistics
 */
export async function getCommentStats() {
  const [total, approved, pending, rejected] = await Promise.all([
    prisma.comment.count(),
    prisma.comment.count({ where: { status: 'APPROVED' } }),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'REJECTED' } }),
  ])

  return {
    total,
    approved,
    pending,
    rejected,
  }
}

// ============ Like Service ============

/**
 * Toggle like status (create or delete)
 */
export async function toggleLike({
  userId,
  targetType,
  targetId,
}: {
  userId: string
  targetType: TargetType
  targetId: string
}): Promise<{ liked: boolean; count: number }> {
  // Check if like exists
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType,
        targetId,
      },
    },
  })

  if (existingLike) {
    // Unlike
    await prisma.like.delete({
      where: { id: existingLike.id },
    })
  } else {
    // Like
    await prisma.like.create({
      data: {
        userId,
        targetType,
        targetId,
      },
    })
  }

  // Get updated count
  const count = await prisma.like.count({
    where: { targetType, targetId },
  })

  return {
    liked: !existingLike,
    count,
  }
}

/**
 * Get like count and user's like status
 */
export async function getLikeInfo({
  targetType,
  targetId,
  userId,
}: {
  targetType: TargetType
  targetId: string
  userId?: string | null
}) {
  const [count, userLiked] = await Promise.all([
    prisma.like.count({
      where: { targetType, targetId },
    }),
    userId
      ? prisma.like.findUnique({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType,
              targetId,
            },
          },
        })
      : Promise.resolve(null),
  ])

  return {
    count,
    userLiked: !!userLiked,
  }
}

// ============ Feature Flags ============

/**
 * Check if comments/likes are enabled
 */
export async function isFeatureEnabled(
  feature: 'comments' | 'likes'
): Promise<boolean> {
  const settings = await getSettings()
  return feature === 'comments' ? settings.enableComments : settings.enableLikes
}
