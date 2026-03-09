import { NextRequest } from 'next/server'
import { validateVerificationCode } from '@/lib/utils/validators'
import { verifyVerificationCode } from '@/lib/email/verification'
import { SignJWT } from 'jose'
import { getApiTranslations } from '@/lib/i18n/config'
import { ApiResponse } from '@/lib/utils/api-response'
import type { VerifyCodeBody } from '@/types/api'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')

/**
 * Verify verification code
 * @description Verify email verification code and return temporary token
 * @tag User - Auth
 * @body VerifyCodeBody
 * @response 200:Code verified successfully, returns token
 * @responseSet public
 * @openapi
 */
export async function POST(request: NextRequest) {
  const t = await getApiTranslations()

  try {
    const { email, code } = (await request.json()) as VerifyCodeBody

    // Validate code format
    if (!validateVerificationCode(code)) {
      return ApiResponse.error(t('register.invalid_code_format'))
    }

    // Verify code
    const result = await verifyVerificationCode(email, code, 'REGISTER')

    if (!result.valid) {
      const errorKey = result.error?.toLowerCase()
      return ApiResponse.error(errorKey ? t(`register.${errorKey}`) : t('register.verify_fail'))
    }

    // Generate temporary token (valid for 30 minutes)
    const token = await new SignJWT({ email, verified: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30m')
      .setIssuedAt()
      .sign(JWT_SECRET)

    return ApiResponse.success({
      token,
      message: t('register.verify_success'),
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}
