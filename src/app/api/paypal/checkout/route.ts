import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { ApiResponse } from '@/lib/utils/api-response'
import { paypalService } from '@/lib/payment/paypal-service'
import type { CreateCheckoutBody } from '@/types/api'

/**
 * Create a PayPal order or subscription
 * @description Create a PayPal payment order or subscription checkout
 * @tag Payment - PayPal
 * @auth sessionAuth
 * @body CreateCheckoutBody
 * @response 200:PayPal order/subscription created successfully
 * @responseSet public
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCheckoutBody
    const { productId, quantity = 1, successUrl, cancelUrl } = body

    if (!productId) {
      return ApiResponse.error('Product ID is required', 400)
    }

    // Get current user session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // For now, always create PayPal order for one-time payment
    // You can fetch product from DB to determine if it's subscription
    const result = await paypalService.createOrder({
      productId,
      quantity,
      userId,
      successUrl: successUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
      cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`,
    })

    return ApiResponse.success(result)
  } catch (error: unknown) {
    console.error('PayPal Checkout Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return ApiResponse.error(message, 500)
  }
}
