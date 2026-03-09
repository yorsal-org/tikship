import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'

/**
 * Update payment method
 * @description Update an existing payment method configuration
 * @tag Admin - Products
 * @auth bearerAuth
 * @response 200:Payment method updated successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; methodId: string }> }
) {
  const { id, methodId } = await params
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_EDIT)
    if (error) return error

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: methodId, productId: id },
    })

    if (!paymentMethod) {
      return await ApiResponse.adminError('not_found', 404)
    }

    const {
      stripePriceId,
      stripeProductId,
      paypalPlanId,
      paypalProductId,
      mode,
      interval,
      intervalCount,
      isActive,
      metadata,
    } = await req.json()

    // Check uniqueness if price IDs changed
    if (
      paymentMethod.provider === 'stripe' &&
      stripePriceId &&
      stripePriceId !== paymentMethod.stripePriceId
    ) {
      const existing = await prisma.paymentMethod.findUnique({
        where: { stripePriceId },
      })
      if (existing) {
        return await ApiResponse.adminError('invalid_input', 400)
      }
    }

    if (
      paymentMethod.provider === 'paypal' &&
      paypalPlanId &&
      paypalPlanId !== paymentMethod.paypalPlanId
    ) {
      const existing = await prisma.paymentMethod.findUnique({
        where: { paypalPlanId },
      })
      if (existing) {
        return await ApiResponse.adminError('invalid_input', 400)
      }
    }

    const updated = await prisma.paymentMethod.update({
      where: { id: methodId },
      data: {
        stripePriceId:
          stripePriceId !== undefined ? stripePriceId : paymentMethod.stripePriceId,
        stripeProductId:
          stripeProductId !== undefined ? stripeProductId : paymentMethod.stripeProductId,
        paypalPlanId: paypalPlanId !== undefined ? paypalPlanId : paymentMethod.paypalPlanId,
        paypalProductId:
          paypalProductId !== undefined ? paypalProductId : paymentMethod.paypalProductId,
        mode: mode || paymentMethod.mode,
        interval: mode === 'subscription' ? interval : null,
        intervalCount: mode === 'subscription' ? Number(intervalCount || 1) : null,
        isActive: isActive !== undefined ? isActive : paymentMethod.isActive,
        metadata: metadata !== undefined ? metadata : paymentMethod.metadata,
      },
    })

    await logAudit({
      adminUserId,
      action: 'update',
      resource: 'payment_method',
      resourceId: updated.id,
      details: { productId: id },
    })

    return ApiResponse.success({ paymentMethod: updated })
  } catch (error) {
    console.error('Update payment method error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Delete payment method
 * @description Remove a payment method from a product
 * @tag Admin - Products
 * @auth bearerAuth
 * @response 200:Payment method deleted successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; methodId: string }> }
) {
  const { id, methodId } = await params
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_EDIT)
    if (error) return error

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: methodId, productId: id },
    })

    if (!paymentMethod) {
      return await ApiResponse.adminError('not_found', 404)
    }

    await prisma.paymentMethod.delete({
      where: { id: methodId },
    })

    await logAudit({
      adminUserId,
      action: 'delete',
      resource: 'payment_method',
      resourceId: methodId,
      details: { productId: id },
    })

    return ApiResponse.success({ message: 'Payment method deleted successfully' })
  } catch (error) {
    console.error('Delete payment method error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
