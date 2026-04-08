import { NextRequest } from 'next/server'
import { requireAdminAuth, createAdminUserWithRoles, bulkAdminUsers, listAdminUsers } from '@/lib/admin'
import type { BulkAdminUserAction } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { checkPasswordStrength } from '@/lib/utils/validators'
import { settingsService } from '@/lib/settings/service'
import { parsePagination } from '@/lib/utils/pagination'

import type { CreateAdminUserBody } from '@/types/api'

/**
 * Get admin users
 * @description Retrieve all admin users with their roles
 * @tag Admin - Users
 * @auth bearerAuth
 * @params {search?: string, page?: number, pageSize?: number}
 * @response 200:Returns paginated list of admin users
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_VIEW)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const { page, pageSize } = parsePagination(
      searchParams.get('page'),
      searchParams.get('pageSize')
    )

    const result = await listAdminUsers({ search, page, pageSize })
    return ApiResponse.success(result)
  } catch (error) {
    console.error('Get admin users error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Create admin user
 * @description Create a new admin user with optional role assignments
 * @tag Admin - Users
 * @auth bearerAuth
 * @body CreateAdminUserBody
 * @response 201:Admin user created successfully
 * @responseSet auth
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_CREATE)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { username, email, password, name, isSuperuser, roleIds } =
      (await req.json()) as CreateAdminUserBody

    if (!username || !email || !password) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    // Validate password strength
    const adminSettings = await settingsService.getAdminSettings()
    const { isValid } = checkPasswordStrength(password, adminSettings.passwordMinStrength)

    if (!isValid) {
      return await ApiResponse.adminError('password_too_weak', 400)
    }

    const user = await createAdminUserWithRoles({
      username,
      email,
      password,
      name,
      isSuperuser: isSuperuser || false,
      roleIds,
      assignedBy: adminUserId,
    })

    return ApiResponse.success({ user }, 201)
  } catch (error: unknown) {
    console.error('Create admin user error:', error)

    if (error instanceof Error) {
      if (error.message === 'USERNAME_EXISTS') {
        return await ApiResponse.adminError('username_exists', 400)
      }
      if (error.message === 'EMAIL_EXISTS') {
        return await ApiResponse.adminError('email_exists', 400)
      }
    }

    // Handle Prisma unique constraint errors (P2002)
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      const prismaError = error as { meta?: { target?: string[] } }
      const targets = prismaError.meta?.target
      if (targets?.includes('username')) {
        return await ApiResponse.adminError('username_exists', 400)
      }
      if (targets?.includes('email')) {
        return await ApiResponse.adminError('email_exists', 400)
      }
    }

    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Bulk update/delete admin users
 * @description Perform bulk actions (activate/deactivate/delete) on multiple admin users
 * @tag Admin - Users
 * @auth bearerAuth
 * @openapi
 */
export async function PUT(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_EDIT)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const body = (await req.json()) as { ids?: unknown; action?: unknown }
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0 || typeof action !== 'string') {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    const validActions: BulkAdminUserAction[] = ['activate', 'deactivate', 'delete']
    if (!validActions.includes(action as BulkAdminUserAction)) {
      return await ApiResponse.adminError('invalid_params', 400)
    }

    if (action === 'delete') {
      const { error: deleteError } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_DELETE)
      if (deleteError) return deleteError
    }

    const result = await bulkAdminUsers({
      ids: ids as string[],
      action: action as BulkAdminUserAction,
      actorId: adminUserId,
    })

    return ApiResponse.success(result)
  } catch (error: unknown) {
    console.error('Bulk update admin users error:', error)

    if (error instanceof Error) {
      if (error.message === 'NO_TARGET_USERS') {
        return await ApiResponse.adminError('cannot_modify_superuser', 400)
      }
      if (error.message === 'CANNOT_DELETE_ACTIVE_OR_SUPERUSER') {
        return await ApiResponse.adminError('cannot_delete_active_or_superuser', 400)
      }
    }

    return await ApiResponse.adminError('server_error', 500)
  }
}
