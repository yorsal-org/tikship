import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { paypalService } from '@/lib/payment/paypal-service'

/**
 * Handle PayPal webhook events
 * @description Process PayPal webhook events for payment and subscription status updates
 * @tag Payment - PayPal
 * @responseSet public
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headers: Record<string, string> = {}

    req.headers.forEach((value, key) => {
      headers[key] = value
    })

    await paypalService.handleWebhook(body, headers)

    return ApiResponse.success({ received: true })
  } catch (error: unknown) {
    console.error('PayPal Webhook Error:', error)
    const message = error instanceof Error ? error.message : 'Webhook handler failed'
    return ApiResponse.error(message, 400)
  }
}
