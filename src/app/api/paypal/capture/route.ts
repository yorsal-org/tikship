import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { paypalService } from '@/lib/payment/paypal-service'
import type { CaptureOrderBody } from '@/types/api'

/**
 * Capture a PayPal order
 * @description Capture a PayPal order after user approval
 * @tag Payment - PayPal
 * @body CaptureOrderBody
 * @response 200:Order captured successfully
 * @responseSet public
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = (await req.json()) as CaptureOrderBody

    if (!orderId) {
      return ApiResponse.error('Order ID is required', 400)
    }

    const result = await paypalService.captureOrder(orderId)

    return ApiResponse.success(result)
  } catch (error: unknown) {
    console.error('PayPal Capture Error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return ApiResponse.error(message, 500)
  }
}
