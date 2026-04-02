import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PERMISSIONS } from '@/config/permissions'
import { PostType } from '@/types/post'

/**
 * Get post statistics
 * @description Retrieve statistics for posts (articles or pages)
 * @tag Admin - Posts
 * @auth bearerAuth
 * @params {type?: 'article' | 'page'}
 * @response 200:Returns post statistics
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') as PostType) || PostType.ARTICLE

    const permission = type === PostType.PAGE ? PERMISSIONS.PAGE_VIEW : PERMISSIONS.ARTICLE_VIEW
    const { error } = await requireAdminAuth(req, permission)
    if (error) return error

    const stats = await postService.getPostStats(type)

    return ApiResponse.success(stats)
  } catch (error) {
    console.error('Get post stats error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
