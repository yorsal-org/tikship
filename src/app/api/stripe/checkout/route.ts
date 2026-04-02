import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { unifiedPaymentService } from '@/lib/payment/unified-service'
import { getUserSessionId } from '@/lib/utils/token'
import type { CreateCheckoutBody } from '@/types/api'

/**
 * Create a checkout session
 * @description Create a payment checkout session (supports both Stripe and PayPal)
 * @tag Payment - Stripe
 * @auth sessionAuth
 * @body CreateCheckoutBody
 * @response 200:Checkout session created successfully
 * @responseSet public
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const {
      productId,
      quantity = 1,
      successUrl,
      cancelUrl,
      paymentProvider,
    } = (await req.json()) as CreateCheckoutBody

    if (!productId) {
      return ApiResponse.error('Product ID is required', 400)
    }

    // Get current user session (only if user module is enabled)
    const userId = await getUserSessionId()

    // Create payment using unified service
    const result = await unifiedPaymentService.createPayment({
      productId,
      quantity,
      userId,
      successUrl,
      cancelUrl,
      paymentProvider,
    })

    return ApiResponse.success(result)
  } catch (error: unknown) {
    console.error('Checkout Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return ApiResponse.error(message, 500)
  }
}
