import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'

/**
 * Get payment methods for a product
 * @description Retrieve all payment methods configured for a specific product
 * @tag Admin - Products
 * @auth bearerAuth
 * @response 200:Returns list of payment methods
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_VIEW)
    if (error) return error

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return await ApiResponse.adminError('not_found', 404)
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    })

    return ApiResponse.success({ paymentMethods })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Create payment method for a product
 * @description Add a new payment method (Stripe or PayPal) to a product
 * @tag Admin - Products
 * @auth bearerAuth
 * @response 201:Payment method created successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_EDIT)
    if (error) return error

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return await ApiResponse.adminError('not_found', 404)
    }

    const {
      provider,
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

    // Validate required fields
    if (!provider) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    // Validate provider-specific fields
    if (provider === 'stripe' && !stripePriceId) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    if (provider === 'paypal' && mode === 'subscription' && !paypalPlanId) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    // Check uniqueness of price IDs
    if (provider === 'stripe' && stripePriceId) {
      const existing = await prisma.paymentMethod.findUnique({
        where: { stripePriceId },
      })
      if (existing) {
        return await ApiResponse.adminError('invalid_input', 400)
      }
    }

    if (provider === 'paypal' && paypalPlanId) {
      const existing = await prisma.paymentMethod.findUnique({
        where: { paypalPlanId },
      })
      if (existing) {
        return await ApiResponse.adminError('invalid_input', 400)
      }
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        productId: id,
        provider,
        stripePriceId: provider === 'stripe' ? stripePriceId : null,
        stripeProductId: provider === 'stripe' ? stripeProductId : null,
        paypalPlanId: provider === 'paypal' && mode === 'subscription' ? paypalPlanId : null,
        paypalProductId: provider === 'paypal' ? paypalProductId : null,
        mode: mode || 'payment',
        interval: mode === 'subscription' ? interval : null,
        intervalCount: mode === 'subscription' ? Number(intervalCount || 1) : null,
        isActive: isActive !== undefined ? isActive : true,
        metadata: metadata || null,
      },
    })

    await logAudit({
      adminUserId,
      action: 'create',
      resource: 'payment_method',
      resourceId: paymentMethod.id,
      details: { productId: id, provider },
    })

    return ApiResponse.success({ paymentMethod }, 201)
  } catch (error) {
    console.error('Create payment method error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
