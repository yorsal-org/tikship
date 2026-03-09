import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getApiTranslations } from '@/lib/i18n/config'
import { validateName, getNameErrorKey } from '@/lib/utils/validators'
import { ApiResponse } from '@/lib/utils/api-response'
import { getAuthenticatedUser } from '@/lib/auth/utils'
import type { UpdateUserProfileBody } from '@/types/api'

/**
 * Get current user profile
 * @description Retrieve the authenticated user's profile information including name, email, image, and linked accounts
 * @tag User - Profile
 * @auth sessionAuth
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  const t = await getApiTranslations()

  try {
    const authUser = await getAuthenticatedUser(req)

    if (!authUser) {
      return ApiResponse.unauthorized(t('unauthorized'))
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        password: true, // Only to check presence
        accounts: {
          select: {
            provider: true,
            type: true,
            providerAccountId: true,
          },
        },
      },
    })

    if (!user) {
      return ApiResponse.notFound(t('user_not_found'))
    }

    return ApiResponse.success({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      accounts: user.accounts,
      hasPassword: !!user.password,
    })
  } catch (error) {
    console.error('[USER_ME_GET_ERROR]:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}

/**
 * Update user profile
 * @description Update the authenticated user's profile information (name and/or image)
 * @tag User - Profile
 * @auth sessionAuth
 * @body UpdateUserProfileBody
 * @response 200:Profile updated successfully
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

    const { name, image } = (await request.json()) as UpdateUserProfileBody

    // Validate name if provided
    if (name !== undefined) {
      const nameValidation = validateName(name)
      if (!nameValidation.valid) {
        const errorKey = getNameErrorKey(nameValidation.error)
        return ApiResponse.error(t(errorKey))
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    return ApiResponse.success({
      user: updatedUser,
    })
  } catch (error) {
    console.error('[USER_ME_PATCH_ERROR]:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}
