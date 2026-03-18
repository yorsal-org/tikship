import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'
import type { UpdateOrderStatusBody } from '@/types/api'
import { OrderStatus } from '@/types/order'

/**
 * Get order details
 * @description Get a single order by ID with product and user information
 * @tag Admin - Orders
 * @auth bearerAuth
 * @response 200:Returns order details
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ORDER_VIEW)
    if (error) return error

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!order) {
      return await ApiResponse.adminError('not_found', 404)
    }

    return ApiResponse.success({ order })
  } catch (error) {
    console.error('Get order error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Update order status
 * @description Update order status (pending, completed, failed, refunded, expired)
 * @tag Admin - Orders
 * @auth bearerAuth
 * @body UpdateOrderStatusBody
 * @response 200:Order status updated successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ORDER_EDIT)
    if (error) return error

    const { status } = (await req.json()) as UpdateOrderStatusBody

    // Validate status
    const validStatuses = Object.values(OrderStatus) as string[]
    if (!status || !validStatuses.includes(status)) {
      return await ApiResponse.adminError('invalid_params', 400)
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    })

    if (!existingOrder) {
      return await ApiResponse.adminError('not_found', 404)
    }

    // Update order
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log audit
    await logAudit({
      adminUserId,
      action: 'update',
      resource: 'order',
      resourceId: order.id,
      details: { oldStatus: existingOrder.status, newStatus: status },
    })

    return ApiResponse.success({ order })
  } catch (error) {
    console.error('Update order error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
