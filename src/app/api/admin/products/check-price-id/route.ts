import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { getApiTranslations } from '@/lib/i18n/config'
import { prisma } from '@/lib/db/prisma'


/**
 * Check if price ID exists
 * @description Check if a Stripe price ID or PayPal plan ID already exists
 * @tag Admin - Products
 * @params CheckPriceIdParams
 * @response 200:Returns whether price ID exists
 * @responseSet public
 * @openapi
 */
export async function GET(request: NextRequest) {
  const t = await getApiTranslations()

  try {
    const { searchParams } = new URL(request.url)
    const stripePriceId = searchParams.get('stripePriceId')
    const paypalPlanId = searchParams.get('paypalPlanId')

    if (!stripePriceId && !paypalPlanId) {
      return ApiResponse.error(t('validation.required'))
    }

    let existingMethod = null

    // Check if payment method with this stripePriceId exists
    if (stripePriceId) {
      existingMethod = await prisma.paymentMethod.findUnique({
        where: { stripePriceId },
        select: { id: true },
      })
    }

    // Check if payment method with this paypalPlanId exists
    if (paypalPlanId && !existingMethod) {
      existingMethod = await prisma.paymentMethod.findUnique({
        where: { paypalPlanId },
        select: { id: true },
      })
    }

    return ApiResponse.success({
      exists: !!existingMethod,
    })
  } catch (error) {
    console.error('Check price ID error:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}
