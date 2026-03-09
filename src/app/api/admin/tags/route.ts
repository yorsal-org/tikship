import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get tags
 * @description Retrieve all post tags
 * @tag Admin - Posts
 * @auth bearerAuth
 * @response 200:Returns list of tags
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ARTICLE_VIEW)
    if (error) return error

    const tags = await postService.listTags()
    return ApiResponse.success({ tags })
  } catch (error) {
    console.error('List tags error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
