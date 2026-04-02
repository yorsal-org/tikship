import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { requireAdminAuth } from '@/lib/admin'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'

/**
 * Reorder categories
 * @description Update sort order for a list of categories
 * @tag Admin - Posts
 * @auth bearerAuth
 * @body {orders: {id: string, order: number}[]}
 * @response 200:Categories reordered successfully
 * @responseSet auth
 * @openapi
 */
export async function PUT(req: NextRequest) {
  const { adminUserId } = await requireAdminAuth(req, PERMISSIONS.ARTICLE_EDIT)
  if (!adminUserId) return ApiResponse.adminError('unauthorized', 401)

  try {
    const { orders } = await req.json()
    if (!Array.isArray(orders) || orders.length === 0) {
      return ApiResponse.adminError('required_fields_missing', 400)
    }

    await postService.reorderCategories(orders)

    await logAudit({
      adminUserId: adminUserId!,
      action: 'category:reorder',
      resource: 'category',
      details: { count: orders.length },
    })

    return ApiResponse.success({ success: true })
  } catch {
    return ApiResponse.adminError('server_error', 500)
  }
}
