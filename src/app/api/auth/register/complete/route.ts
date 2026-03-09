import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { validateName, validatePasswordStrength, getNameErrorKey } from '@/lib/utils/validators'
import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import { getApiTranslations } from '@/lib/i18n/config'
import { siteConfig } from '@/config/site'
import { ApiResponse } from '@/lib/utils/api-response'
import type { CompleteRegistrationBody } from '@/types/api'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')

/**
 * Complete registration
 * @description Complete user registration with name, password, and avatar
 * @tag User - Auth
 * @body CompleteRegistrationBody
 * @response 200:Registration completed successfully
 * @responseSet public
 * @openapi
 */
export async function POST(request: NextRequest) {
  const t = await getApiTranslations()

  try {
    const { token, name, password, avatarUrl } = (await request.json()) as CompleteRegistrationBody

    // Verify token
    let email: string
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      email = payload.email as string
      if (!payload.verified) {
        throw new Error('Invalid token')
      }
    } catch {
      return ApiResponse.unauthorized(t('register.token_expired'))
    }

    // Validate name
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      const errorKey = getNameErrorKey(nameValidation.error)
      return ApiResponse.error(t(errorKey))
    }

    // Validate password
    const passwordValidation = validatePasswordStrength(password)
    const minStrength = siteConfig.auth.password.minStrength as 'weak' | 'medium' | 'strong'
    const strengthWeight: Record<string, number> = {
      none: 0,
      weak: 1,
      medium: 2,
      strong: 3,
    }

    if (strengthWeight[passwordValidation.level] < strengthWeight[minStrength]) {
      const errorMessages = passwordValidation.errors.map((err: string) => t(err))
      return ApiResponse.error(
        errorMessages.length > 0 ? errorMessages.join(', ') : t('register.password_weak')
      )
    }

    // Check if email already exists (double check)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return ApiResponse.error(t('register.email_exists'))
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name.trim(),
        password: hashedPassword,
        image: avatarUrl || null,
        emailVerified: new Date(), // Mark email as verified
      },
    })

    return ApiResponse.success({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      message: t('register.register_success'),
    })
  } catch (error) {
    console.error('Complete registration error:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}
