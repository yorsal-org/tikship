import { NextRequest } from 'next/server'
import { validateEmailStrict, getEmailErrorKey } from '@/lib/utils/validators'
import { sendVerificationCode } from '@/lib/email/verification'
import { prisma } from '@/lib/db/prisma'
import { getApiTranslations } from '@/lib/i18n/config'
import { ApiResponse } from '@/lib/utils/api-response'
import type { SendVerificationCodeBody } from '@/types/api'

/**
 * Send verification code
 * @description Send email verification code for user registration
 * @tag User - Auth
 * @body SendVerificationCodeBody
 * @response 200:Verification code sent successfully
 * @responseSet public
 * @openapi
 */
export async function POST(request: NextRequest) {
  const t = await getApiTranslations()

  try {
    const { email } = (await request.json()) as SendVerificationCodeBody

    // Validate email
    const emailValidation = validateEmailStrict(email)
    if (!emailValidation.valid) {
      const errorKey = getEmailErrorKey(emailValidation.error)
      return ApiResponse.error(t(errorKey))
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return ApiResponse.error(t('register.email_exists'))
    }

    // Send verification code
    const result = await sendVerificationCode(email, 'REGISTER')

    if (!result.success) {
      const errorKey = result.error?.toLowerCase()
      return ApiResponse.error(errorKey ? t(`register.${errorKey}`) : t('register.send_failed'))
    }

    return ApiResponse.success({
      message: t('success'),
    })
  } catch (error) {
    console.error('Send verification code error:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}
