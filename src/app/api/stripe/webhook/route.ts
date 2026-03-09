import { NextRequest } from 'next/server'
import { stripeService } from '@/lib/payment/stripe-service'
import { ApiResponse } from '@/lib/utils/api-response'

/**
 * Handle Stripe webhook events
 * @description Process Stripe webhook events for payment status updates
 * @tag Payment - Stripe
 * @responseSet public
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return ApiResponse.error('Missing stripe-signature header', 400)
    }

    // Verify and process webhook
    await stripeService.handleWebhook(body, signature)

    return ApiResponse.success({ received: true })
  } catch (error: unknown) {
    console.error('Webhook Error:', error)
    const message = error instanceof Error ? error.message : 'Webhook handler failed'
    return ApiResponse.error(message, 400)
  }
}
