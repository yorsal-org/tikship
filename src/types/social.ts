// Social Module Type Definitions
// Comments, Replies, Likes - Settings moved to types/settings.ts

// Comment Status
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// Target Types
export type TargetType = 'blog' | 'page' | 'product'

// Base User for display (minimal info)
export interface CommentUser {
  id: string
  name: string | null
  image: string | null
}

// Comment entity
export interface Comment {
  id: string
  content: string
  userId: string
  targetType: TargetType
  targetId: string
  status: CommentStatus
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
  user?: CommentUser
  replies?: Reply[]
}

// Reply entity
export interface Reply {
  id: string
  content: string
  userId: string
  commentId: string
  status: CommentStatus
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
  user?: CommentUser
}

// Like entity
export interface Like {
  id: string
  userId: string
  targetType: TargetType
  targetId: string
  createdAt: Date
}

// API Request Types
export interface CreateCommentBody {
  content: string
  targetType: TargetType
  targetId: string
}

export interface CreateReplyBody {
  content: string
}

export interface ToggleLikeBody {
  targetType: TargetType
  targetId: string
}

export interface UpdateCommentStatusBody {
  status: CommentStatus
}

export interface UpdateSettingsBody {
  commentRequireApproval?: boolean
  replyRequireApproval?: boolean
  maxCommentLength?: number
  maxReplyLength?: number
  enableComments?: boolean
  enableLikes?: boolean
  sensitiveWords?: string
}

// API Response Types
export interface CommentsListResponse {
  comments: Comment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CommentWithReplies extends Comment {
  replies: Reply[]
  _count: {
    replies: number
  }
}

export interface CommentDetailResponse {
  comment: CommentWithReplies
}

export interface LikeResponse {
  liked: boolean
  count: number
}

export interface LikeCountResponse {
  count: number
  userLiked: boolean
}

export interface AdminCommentsListResponse {
  comments: Array<Comment & { repliesCount: number }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminCommentDetailResponse {
  comment: CommentWithReplies
}
