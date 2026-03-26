import { prisma } from '@/lib/db/prisma'
import { PostInput, PostStatus, PostType, PostBulkAction } from '@/types/post'

export interface CategoryTree {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  _count?: { posts: number }
  children: CategoryTree[]
}

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
    categoryIds?: string[]
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
      categoryIds,
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
      categories?: { some: { categoryId: string | { in: string[] } } }
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
      ...(categoryIds && categoryIds.length > 0
        ? { categories: { some: { categoryId: { in: categoryIds } } } }
        : categoryId
          ? { categories: { some: { categoryId } } }
          : {}),
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
   * List published posts for public display
   * Includes: status=PUBLISHED + status=SCHEDULED with publishedAt <= now
   */
  async listPublicPosts(params: {
    type?: PostType
    categoryIds?: string[]
    tagId?: string
    search?: string
    page?: number
    pageSize?: number
    orderBy?: 'createdAt' | 'publishedAt' | 'title'
    orderDir?: 'asc' | 'desc'
  }) {
    const {
      type,
      categoryIds,
      tagId,
      search,
      page = 1,
      pageSize = 10,
      orderBy = 'publishedAt',
      orderDir = 'desc',
    } = params

    const now = new Date()

    const where = {
      ...(type ? { type } : {}),
      ...(categoryIds && categoryIds.length > 0
        ? { categories: { some: { categoryId: { in: categoryIds } } } }
        : {}),
      ...(tagId ? { tags: { some: { tagId } } } : {}),
      AND: [
        // Published: directly published OR scheduled with past publishedAt
        {
          OR: [
            { status: PostStatus.PUBLISHED },
            { status: PostStatus.SCHEDULED, publishedAt: { lte: now } },
          ],
        },
        // Search filter
        ...(search
          ? [
              {
                OR: [
                  { title: { contains: search, mode: 'insensitive' as const } },
                  { content: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
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

    // Upsert tags and collect their IDs
    let tagConnects: { tagId: string }[] = []
    if (data.tagNames && data.tagNames.length > 0) {
      const tagIds = await Promise.all(
        data.tagNames.map(async (name) => {
          const tagSlug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\p{L}\p{N}\-]/gu, '')
            .replace(/-{2,}/g, '-')
            .replace(/^-+|-+$/g, '')
          
          // Try to find existing tag by slug first (slug is the unique identifier)
          let tag = await prisma.tag.findUnique({
            where: { slug: tagSlug },
            select: { id: true },
          })
          
          // If not found, create new tag
          if (!tag) {
            tag = await prisma.tag.create({
              data: { name, slug: tagSlug },
              select: { id: true },
            })
          }
          
          return tag.id
        })
      )
      tagConnects = tagIds.map((tagId) => ({ tagId }))
    }

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
        tags: tagConnects.length > 0
          ? { create: tagConnects }
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

    // Upsert tags and collect their IDs
    let tagConnects: { tagId: string }[] | undefined
    if (data.tagNames) {
      if (data.tagNames.length > 0) {
        const tagIds = await Promise.all(
          data.tagNames.map(async name => {
            const tagSlug = name
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^\p{L}\p{N}\-]/gu, '')
              .replace(/-{2,}/g, '-')
              .replace(/^-+|-+$/g, '')
            
            // Try to find existing tag by slug first (slug is the unique identifier)
            let tag = await prisma.tag.findUnique({
              where: { slug: tagSlug },
              select: { id: true },
            })
            
            // If not found, create new tag
            if (!tag) {
              tag = await prisma.tag.create({
                data: { name, slug: tagSlug },
                select: { id: true },
              })
            }
            
            return tag.id
          })
        )
        tagConnects = tagIds.map(tagId => ({ tagId }))
      } else {
        tagConnects = []
      }
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
        tags: data.tagNames
          ? {
              deleteMany: {},
              create: tagConnects,
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

  async getPostsByIds(ids: string[], type?: PostType) {
    return await prisma.post.findMany({
      where: {
        id: { in: ids },
        ...(type ? { type } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
      },
    })
  }

  async updatePostsStatus(ids: string[], status: PostStatus) {
    return await prisma.post.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : undefined,
        modifiedAt: new Date(),
      },
    })
  }

  async deletePosts(ids: string[], permanent: boolean = false) {
    if (permanent) {
      return await prisma.post.deleteMany({
        where: { id: { in: ids } },
      })
    }

    return await prisma.post.updateMany({
      where: { id: { in: ids } },
      data: {
        status: PostStatus.TRASH,
        modifiedAt: new Date(),
      },
    })
  }

  async bulkOperatePosts(ids: string[], action: PostBulkAction) {
    switch (action) {
      case 'publish':
        return await this.updatePostsStatus(ids, PostStatus.PUBLISHED)
      case 'trash':
        return await this.deletePosts(ids, false)
      case 'restore':
        return await this.updatePostsStatus(ids, PostStatus.DRAFT)
      case 'delete':
        return await this.deletePosts(ids, true)
      default:
        throw new Error('INVALID_BULK_ACTION')
    }
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

  private async getCategoryDepth(categoryId: string): Promise<number> {
    let depth = 1
    let currentId: string | null = categoryId
    while (currentId) {
      const cat: { parentId: string | null } | null = await prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })
      if (!cat || !cat.parentId) break
      depth++
      currentId = cat.parentId
    }
    return depth
  }

  private buildCategoryTree(
    flatList: Array<{
      id: string
      name: string
      slug: string
      description: string | null
      parentId: string | null
      locale: string
      createdAt: Date
      updatedAt: Date
      _count?: { posts: number }
    }>,
    postIdsByCategoryId?: Map<string, Set<string>>
  ): CategoryTree[] {
    const map = new Map<string, CategoryTree>()
    const roots: CategoryTree[] = []
    for (const cat of flatList) {
      map.set(cat.id, { ...cat, children: [] })
    }
    for (const cat of flatList) {
      const node = map.get(cat.id)!
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    if (postIdsByCategoryId) {
      // 去重聚合：自底向上收集唯一 postId，避免同一篇文章被多个分类重复计数
      const collectPostIds = (node: CategoryTree): Set<string> => {
        const ids = new Set<string>(postIdsByCategoryId.get(node.id) ?? [])
        for (const child of node.children) {
          for (const id of collectPostIds(child)) {
            ids.add(id)
          }
        }
        node._count = { posts: ids.size }
        return ids
      }
      for (const root of roots) {
        collectPostIds(root)
      }
    } else {
      // 简单数字累加（可能重复计数跨分类的文章）
      const aggregateCount = (node: CategoryTree): number => {
        const direct = node._count?.posts ?? 0
        const childTotal = node.children.reduce((sum, child) => sum + aggregateCount(child), 0)
        const total = direct + childTotal
        if (node._count) {
          node._count.posts = total
        } else {
          node._count = { posts: total }
        }
        return total
      }
      for (const root of roots) {
        aggregateCount(root)
      }
    }

    return roots
  }

  async listCategories(locale?: string) {
    return await prisma.category.findMany({
      where: locale ? { locale } : undefined,
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async listCategoriesTree(locale?: string): Promise<CategoryTree[]> {
    const flat = await prisma.category.findMany({
      where: locale ? { locale } : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        locale: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        posts: { select: { postId: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })
    const postIdsByCategoryId = new Map<string, Set<string>>(
      flat.map((cat) => [cat.id, new Set(cat.posts.map((p) => p.postId))])
    )
    return this.buildCategoryTree(flat, postIdsByCategoryId)
  }

  /**
   * List categories as a tree for public display
   * Only counts published posts (status=PUBLISHED with publishedAt <= now)
   * unique postId
   */
  async listPublicCategoriesTree(locale?: string): Promise<CategoryTree[]> {
    const now = new Date()
    const flat = await prisma.category.findMany({
      where: locale ? { locale } : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
        posts: {
          select: { postId: true },
          where: {
            post: {
              status: PostStatus.PUBLISHED,
              OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
            },
          },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })
    const postIdsByCategoryId = new Map<string, Set<string>>(
      flat.map((cat) => [cat.id, new Set(cat.posts.map((p) => p.postId))])
    )
    return this.buildCategoryTree(flat, postIdsByCategoryId)
  }

  async createCategory(name: string, description?: string, parentId?: string, locale: string = 'en') {
    if (parentId) {
      const parentDepth = await this.getCategoryDepth(parentId)
      if (parentDepth >= 3) throw new Error('MAX_DEPTH_EXCEEDED')
    }

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\-]/gu, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')

    let slug = baseSlug
    let counter = 1
    while (true) {
      const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } })
      if (!existing) break
      counter++
      slug = `${baseSlug}-${counter}`
    }

    return await prisma.category.create({
      data: { name, slug, description, parentId: parentId || null, locale },
    })
  }

  async reorderCategories(orders: { id: string; order: number }[]) {
    await prisma.$transaction(
      orders.map(({ id, order }) =>
        prisma.category.update({ where: { id }, data: { order } })
      )
    )
  }

  async updateCategory(id: string, name: string, description?: string, parentId?: string | null, locale?: string) {
    if (parentId) {
      // Ensure we don't create circular reference
      if (parentId === id) throw new Error('CIRCULAR_REFERENCE')
      const parentDepth = await this.getCategoryDepth(parentId)
      if (parentDepth >= 3) throw new Error('MAX_DEPTH_EXCEEDED')
    }

    return await prisma.category.update({
      where: { id },
      data: { name, description, parentId: parentId ?? null, ...(locale ? { locale } : {}) },
    })
  }

  async deleteCategory(id: string) {
    return await prisma.category.delete({
      where: { id },
    })
  }

  /**
   * Get all descendant category IDs (inclusive of the given id)
   * Recursively collects children and grandchildren from the flat category list
   */
  async getAllDescendantCategoryIds(categoryId: string): Promise<string[]> {
    const all = await prisma.category.findMany({
      select: { id: true, parentId: true },
    })
    const result: string[] = []
    const queue: string[] = [categoryId]
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)
      for (const cat of all) {
        if (cat.parentId === current) {
          queue.push(cat.id)
        }
      }
    }
    return result
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
