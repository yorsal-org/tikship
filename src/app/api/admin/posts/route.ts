import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { PostStatus, PostType, PostInput, PostBulkAction } from '@/types/post'
import { parsePagination } from '@/lib/utils/pagination'
import type { CreatePostBody, BulkUpdatePostsBody } from '@/types/api'

/**
 * Get posts list
 * @description Retrieve paginated list of posts (articles or pages) with filtering options
 * @tag Admin - Posts
 * @auth bearerAuth
 * @params PostQueryParams
 * @response 200:Returns paginated list of posts
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') as PostType) || PostType.ARTICLE

    // Choose permission based on type
    const permission = type === PostType.PAGE ? PERMISSIONS.PAGE_VIEW : PERMISSIONS.ARTICLE_VIEW
    const { error } = await requireAdminAuth(req, permission)
    if (error) return error

    const status = (searchParams.get('status') as PostStatus) || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const tagId = searchParams.get('tagId') || undefined
    const search = searchParams.get('search') || ''
    const { page, pageSize } = parsePagination(
      searchParams.get('page'),
      searchParams.get('pageSize'),
      { defaultPageSize: 10 }
    )

    const result = await postService.listPosts({
      type,
      status,
      categoryId,
      tagId,
      search,
      page,
      pageSize,
    })

    return ApiResponse.success(result)
  } catch (error) {
    console.error('List posts error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Create post
 * @description Create a new post (article or page)
 * @tag Admin - Posts
 * @auth bearerAuth
 * @body CreatePostBody
 * @response 201:Post created successfully
 * @responseSet auth
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreatePostBody
    const typeString = body.type || 'ARTICLE'
    const type = typeString === 'PAGE' ? PostType.PAGE : PostType.ARTICLE

    const permission = type === PostType.PAGE ? PERMISSIONS.PAGE_CREATE : PERMISSIONS.ARTICLE_CREATE
    const { adminUserId, error } = await requireAdminAuth(req, permission)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    // Convert body to PostInput format
    const postInput = {
      title: body.title,
      content: body.content || '',
      slug: body.slug,
      excerpt: body.excerpt,
      featuredImage: body.featuredImage,
      type,
      status: body.status,
      publishedAt: body.publishedAt,
      categoryIds: body.categoryIds,
      tagNames: body.tagNames,
    } as PostInput

    const post = await postService.createPost(adminUserId, postInput)

    await logAudit({
      adminUserId,
      action: type === PostType.PAGE ? AUDIT_ACTIONS.PAGE_CREATE : AUDIT_ACTIONS.ARTICLE_CREATE,
      resource: type === PostType.PAGE ? 'page' : 'article',
      resourceId: post.id,
      details: { title: post.title, slug: post.slug },
    })

    return ApiResponse.success({ post }, 201)
  } catch (error) {
    console.error('Create post error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}


/**
 * bulk update post
 * @description bulk update a post (article or page)
 * @tag Admin - Posts
 * @auth bearerAuth
 * @body BulkUpdatePostsBody
 * @response 201:Post updated successfully
 * @responseSet auth
 * @openapi
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as BulkUpdatePostsBody
    const typeString = body.type || 'ARTICLE'
    const type = typeString === 'PAGE' ? PostType.PAGE : PostType.ARTICLE

    if (!Array.isArray(body.ids) || body.ids.length === 0 || !body.action) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    const permissionMap: Record<PostBulkAction, string> = {
      publish: type === PostType.PAGE ? PERMISSIONS.PAGE_EDIT : PERMISSIONS.ARTICLE_EDIT,
      trash: type === PostType.PAGE ? PERMISSIONS.PAGE_DELETE : PERMISSIONS.ARTICLE_DELETE,
      delete: type === PostType.PAGE ? PERMISSIONS.PAGE_DELETE : PERMISSIONS.ARTICLE_DELETE,
      restore: type === PostType.PAGE ? PERMISSIONS.PAGE_EDIT : PERMISSIONS.ARTICLE_EDIT,
    }

    const { adminUserId, error } = await requireAdminAuth(req, permissionMap[body.action])
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const posts = await postService.getPostsByIds(body.ids, type)
    if (posts.length !== body.ids.length) {
      return await ApiResponse.adminError('not_found', 404)
    }

    await postService.bulkOperatePosts(body.ids, body.action)

    const auditActionMap: Record<PostType, string> = {
      [PostType.ARTICLE]: 'ARTICLE_EDIT',
      [PostType.PAGE]: 'PAGE_EDIT',
    }

    await Promise.all(
      posts.map(post =>
        logAudit({
          adminUserId,
          action: body.action === 'delete'
            ? type === PostType.PAGE
              ? AUDIT_ACTIONS.PAGE_DELETE
              : AUDIT_ACTIONS.ARTICLE_DELETE
            : auditActionMap[type],
          resource: type === PostType.PAGE ? 'page' : 'article',
          resourceId: post.id,
          details: { bulkAction: body.action, title: post.title, slug: post.slug },
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        })
      )
    )

    return ApiResponse.success({ count: posts.length })
  } catch (error) {
    console.error('Bulk update posts error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
