import { prisma } from '@/lib/db/prisma'
import { PostInput, PostStatus, PostType } from '@/types/post'

export class PostService {
  /**
   * Get a single post by ID or Slug
   */
  async getPost(identifier: string, type?: PostType) {
    return await prisma.post.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
        ...(type ? { type } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        metas: true,
      },
    })
  }

  /**
   * List posts with filtering and pagination
   */
  async listPosts(params: {
    type?: PostType
    status?: PostStatus
    categoryId?: string
    tagId?: string
    authorId?: string
    search?: string
    page?: number
    pageSize?: number
    orderBy?: 'createdAt' | 'publishedAt' | 'title'
    orderDir?: 'asc' | 'desc'
  }) {
    const {
      type,
      status,
      categoryId,
      tagId,
      authorId,
      search,
      page = 1,
      pageSize = 10,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = params

    const now = new Date()

    const where: {
      type?: PostType
      authorId?: string
      categories?: { some: { categoryId: string } }
      tags?: { some: { tagId: string } }
      OR?: Array<
        | { title: { contains: string; mode: 'insensitive' } }
        | { content: { contains: string; mode: 'insensitive' } }
        | { status: PostStatus; publishedAt?: { lte: Date } }
      >
      status?: PostStatus
      publishedAt?: { gt: Date; lte?: Date }
    } = {
      ...(type ? { type } : {}),
      ...(authorId ? { authorId } : {}),
      ...(categoryId ? { categories: { some: { categoryId } } } : {}),
      ...(tagId ? { tags: { some: { tagId } } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { content: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    // Special handling for status filtering
    if (status === PostStatus.PUBLISHED) {
      // Published includes: directly published + scheduled but time has passed
      where.OR = [
        { status: PostStatus.PUBLISHED },
        { status: PostStatus.SCHEDULED, publishedAt: { lte: now } },
      ]
    } else if (status === PostStatus.SCHEDULED) {
      // Scheduled only includes posts with future publish time
      where.status = PostStatus.SCHEDULED
      where.publishedAt = { gt: now }
    } else if (status) {
      // Other statuses match directly
      where.status = status
    }

    const [total, items] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, username: true, name: true, avatar: true },
          },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { [orderBy]: orderDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  /**
   * Get stats for posts
   */
  async getPostStats(type: PostType) {
    const now = new Date()

    const [total, publishedDirect, scheduledPast, draft, trash] = await Promise.all([
      prisma.post.count({ where: { type } }),
      // Directly marked as published
      prisma.post.count({ where: { type, status: PostStatus.PUBLISHED } }),
      // Scheduled but time has passed
      prisma.post.count({
        where: {
          type,
          status: PostStatus.SCHEDULED,
          publishedAt: { lte: now },
        },
      }),
      prisma.post.count({ where: { type, status: PostStatus.DRAFT } }),
      prisma.post.count({ where: { type, status: PostStatus.TRASH } }),
    ])

    // Scheduled but time has not arrived yet
    const scheduledFuture = await prisma.post.count({
      where: {
        type,
        status: PostStatus.SCHEDULED,
        publishedAt: { gt: now },
      },
    })

    return {
      total,
      published: publishedDirect + scheduledPast, // Merge calculation
      draft,
      trash,
      scheduled: scheduledFuture, // Only count future scheduled
    }
  }

  /**
   * Create a new post
   */
  async createPost(authorId: string, data: PostInput) {
    const slug = await this.generateUniqueSlug(data.slug || data.title)

    return await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        slug,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        type: data.type || PostType.ARTICLE,
        status: data.status || PostStatus.DRAFT,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        publishedAt:
          data.status === PostStatus.PUBLISHED ? data.publishedAt || new Date() : data.publishedAt,
        authorId,
        categories: data.categoryIds
          ? {
              create: data.categoryIds.map(id => ({
                category: { connect: { id } },
              })),
            }
          : undefined,
        metas: data.metas
          ? {
              create: Object.entries(data.metas).map(([key, value]) => ({
                key,
                value,
              })),
            }
          : undefined,
      },
    })
  }

  /**
   * Update an existing post and save content snapshot to version
   */
  async updatePost(id: string, data: Partial<PostInput>) {
    const currentPost = await prisma.post.findUnique({
      where: { id },
      select: { content: true, slug: true },
    })

    if (!currentPost) throw new Error('Post not found')

    // Handle slug change if provided
    let slug = currentPost.slug
    if (data.slug && data.slug !== currentPost.slug) {
      slug = await this.generateUniqueSlug(data.slug)
    } else if (data.title && !data.slug) {
      // Don't auto-regenerate slug on title update unless explicitly requested or it's a new draft
    }

    // Perform updates
    return await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        slug,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        status: data.status,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        publishedAt:
          data.status === PostStatus.PUBLISHED ? data.publishedAt || new Date() : data.publishedAt,
        modifiedAt: new Date(),
        categories: data.categoryIds
          ? {
              deleteMany: {},
              create: data.categoryIds.map(cid => ({
                category: { connect: { id: cid } },
              })),
            }
          : undefined,
        metas: data.metas
          ? {
              deleteMany: {},
              create: Object.entries(data.metas).map(([key, value]) => ({
                key,
                value,
              })),
            }
          : undefined,
      },
    })
  }

  /**
   * Delete a post
   */
  async deletePost(id: string, permanent: boolean = false) {
    if (permanent) {
      return await prisma.post.delete({ where: { id } })
    }
    return await prisma.post.update({
      where: { id },
      data: { status: PostStatus.TRASH },
    })
  }

  /**
   * Generate a unique slug with incrementing suffix
   * Preserves Unicode characters (Chinese, Japanese, Korean, etc.)
   */
  private async generateUniqueSlug(text: string): Promise<string> {
    const baseSlug = text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\p{L}\p{N}\-]/gu, '') // Keep letters, numbers, and hyphens (Unicode-aware)
      .replace(/-{2,}/g, '-') // Merge multiple hyphens into one
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

    let slug = baseSlug
    let counter = 1

    while (true) {
      const existing = await prisma.post.findUnique({
        where: { slug },
        select: { id: true },
      })

      if (!existing) return slug

      counter++
      slug = `${baseSlug}-${counter}`
    }
  }

  // --- Category and Tag Helpers ---

  async listCategories() {
    return await prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async createCategory(name: string, description?: string) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\-]/gu, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
    return await prisma.category.create({
      data: { name, slug, description },
    })
  }

  async deleteCategory(id: string) {
    return await prisma.category.delete({
      where: { id },
    })
  }

  async listTags() {
    return await prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Get a post for public display
   * @param slug - Post slug
   * @param type - Post type
   * @param isAdmin - If true, skip publish status checks (for admin preview)
   */
  async getPublicPost(slug: string, type: PostType, isAdmin: boolean = false) {
    return await prisma.post.findFirst({
      where: {
        slug,
        type,
        // Only apply publish restrictions for non-admin users
        ...(isAdmin
          ? {}
          : {
              status: PostStatus.PUBLISHED,
              // Ensure scheduled posts aren't shown if publishedAt is in the future
              OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
            }),
      },
      include: {
        author: {
          select: { username: true, name: true, avatar: true },
        },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    })
  }
}

export const postService = new PostService()
