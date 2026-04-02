import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'

/**
 * Toggle product active status
 * @description Toggle product active/inactive status
 * @tag Admin - Products
 * @auth bearerAuth
 * @response 200:Product status toggled successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_EDIT)
    if (error) return error

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return await ApiResponse.adminError('not_found', 404)
    }

    // Toggle active status
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: !existingProduct.isActive },
    })

    // Log audit
    await logAudit({
      adminUserId,
      action: 'update',
      resource: 'product',
      resourceId: product.id,
      details: {
        name: product.name,
        action: 'toggle_active',
        oldStatus: existingProduct.isActive,
        newStatus: product.isActive,
      },
    })

    return ApiResponse.success({ product })
  } catch (error) {
    console.error('Toggle product active error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
