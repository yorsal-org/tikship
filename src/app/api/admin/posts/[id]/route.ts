import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'
import { PostType, PostInput } from '@/types/post'
import type { UpdatePostBody } from '@/types/api'

/**
 * Get post details
 * @description Retrieve detailed information about a specific post
 * @tag Admin - Posts
 * @auth bearerAuth
 * @response 200:Returns post details
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await postService.getPost(id)
    if (!post) {
      return await ApiResponse.adminError('not_found', 404)
    }

    const permission =
      post.type === PostType.PAGE ? PERMISSIONS.PAGE_VIEW : PERMISSIONS.ARTICLE_VIEW
    const { error } = await requireAdminAuth(req, permission)
    if (error) return error

    return ApiResponse.success({ post })
  } catch (error) {
    console.error('Get post error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Update post
 * @description Update post information including title, content, status, and metadata
 * @tag Admin - Posts
 * @auth bearerAuth
 * @body UpdatePostBody
 * @response 200:Post updated successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await req.json()) as UpdatePostBody

    // Check current type for permission
    const existing = await postService.getPost(id)
    if (!existing) return await ApiResponse.adminError('not_found', 404)

    const permission =
      existing.type === PostType.PAGE ? PERMISSIONS.PAGE_EDIT : PERMISSIONS.ARTICLE_EDIT
    const { adminUserId, error } = await requireAdminAuth(req, permission)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    // Convert status string to PostStatus enum if provided
    const updateData = {
      ...body,
      status: body.status
    } as Partial<PostInput>

    const post = await postService.updatePost(id, updateData)

    await logAudit({
      adminUserId,
      action: post.type === PostType.PAGE ? 'PAGE_EDIT' : 'ARTICLE_EDIT',
      resource: post.type === PostType.PAGE ? 'page' : 'article',
      resourceId: post.id,
      details: { title: post.title, slug: post.slug },
    })

    return ApiResponse.success({ post })
  } catch (error) {
    console.error('Update post error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Delete post
 * @description Delete post (move to trash or permanent deletion)
 * @tag Admin - Posts
 * @auth bearerAuth
 * @params {permanent?: boolean}
 * @response 200:Post deleted successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const permanent = searchParams.get('permanent') === 'true'

    const existing = await postService.getPost(id)
    if (!existing) return await ApiResponse.adminError('not_found', 404)

    const permission =
      existing.type === PostType.PAGE ? PERMISSIONS.PAGE_DELETE : PERMISSIONS.ARTICLE_DELETE
    const { adminUserId, error } = await requireAdminAuth(req, permission)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    await postService.deletePost(id, permanent)

    await logAudit({
      adminUserId,
      action: existing.type === PostType.PAGE ? 'PAGE_DELETE' : 'ARTICLE_DELETE',
      resource: existing.type === PostType.PAGE ? 'page' : 'article',
      resourceId: id,
      details: { permanent },
    })

    return ApiResponse.success({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Delete post error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
