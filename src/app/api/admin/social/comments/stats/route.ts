import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { socialService } from '@/lib/social'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get comment statistics
 * @description Retrieve comment statistics including total, approved, pending, and rejected counts
 * @tag Admin - Social
 * @auth bearerAuth
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.COMMENT_MANAGE)
    if (error) return error

    const stats = await socialService.getCommentStats()

    return ApiResponse.success(stats)
  } catch (error) {
    console.error('Get comment stats error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
