import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { PostStatus, PostType, PostInput } from '@/types/post'
import type { CreatePostBody } from '@/types/api'

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
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

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
      categoryIds: body.categoryId ? [body.categoryId] : undefined,
      tagNames: body.tagIds,
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
