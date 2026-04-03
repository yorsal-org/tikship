import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { hashPassword } from '@/lib/utils/password'
import { checkPasswordStrength } from '@/lib/utils/validators'
import { settingsService } from '@/lib/settings/service'
import type { UpdateMemberPasswordBody } from '@/types/api'

/**
 * Update user password
 * @description Admin can update a user's password
 * @tag Admin - Members
 * @auth bearerAuth
 * @body UpdateMemberPasswordBody
 * @response 200:Password updated successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.USER_EDIT)
    if (error) return error

    const { id } = await params
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { password } = (await req.json()) as UpdateMemberPasswordBody

    if (!password) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    // Validate password strength
    const adminSettings = await settingsService.getAdminSettings()
    const { isValid } = checkPasswordStrength(password, adminSettings.passwordMinStrength)

    if (!isValid) {
      return await ApiResponse.adminError('password_too_weak', 400)
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return await ApiResponse.adminError('user_not_found', 404)
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password)

    // Update user password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    })

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.USER_UPDATE,
      resource: 'user',
      resourceId: user.id,
      details: { action: 'password_changed' },
    })

    return ApiResponse.success({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Update member password error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
