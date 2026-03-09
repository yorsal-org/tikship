import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import { getApiTranslations } from '@/lib/i18n/config'
import { ApiResponse } from '@/lib/utils/api-response'
import { getAuthenticatedUser } from '@/lib/auth/utils'
import type { UpdatePasswordBody } from '@/types/api'

/**
 * Change password
 * @description Update the current user's password (requires current password if already set)
 * @tag User - Profile
 * @auth sessionAuth
 * @body UpdatePasswordBody
 * @response 200:Password updated successfully
 * @responseSet auth
 * @openapi
 */
export async function PATCH(request: NextRequest) {
  const t = await getApiTranslations()

  try {
    const authUser = await getAuthenticatedUser(request)

    if (!authUser) {
      return ApiResponse.unauthorized(t('unauthorized'))
    }

    const { currentPassword, newPassword } = (await request.json()) as UpdatePasswordBody

    if (!newPassword) {
      return ApiResponse.error(t('password.required'))
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        password: true,
      },
    })

    if (!user) {
      return ApiResponse.notFound(t('user_not_found'))
    }

    // If user has a password, currentPassword is required and must be correct
    if (user.password) {
      if (!currentPassword) {
        return ApiResponse.error(t('password.required'))
      }

      const isCorrect = await verifyPassword(currentPassword, user.password)
      if (!isCorrect) {
        return ApiResponse.error(t('password.current_incorrect'))
      }
    }

    // Hash and update to new password
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return ApiResponse.success({ message: t('password.update_success') })
  } catch (error) {
    console.error('Password update error:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}
