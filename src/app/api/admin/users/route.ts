import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { createAdminUser } from '@/lib/auth/admin'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { checkPasswordStrength } from '@/lib/utils/validators'
import { siteConfig } from '@/config/site'
 
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
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          avatar: true,
          isSuperuser: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.adminUser.count({ where }),
    ])

    return ApiResponse.success({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
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
    const minStrength = siteConfig.admin.password.minStrength as 'weak' | 'medium' | 'strong'
    const { isValid } = checkPasswordStrength(password, minStrength)

    if (!isValid) {
      return await ApiResponse.adminError('password_too_weak', 400)
    }

    // Create admin user (existence checks are now inside createAdminUser)
    const user = await createAdminUser({
      username,
      email,
      password,
      name,
      isSuperuser: isSuperuser || false,
      assignDefaultRole: !roleIds || roleIds.length === 0,
    })

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      await Promise.all(
        roleIds.map((roleId: string) =>
          prisma.adminUserRole.create({
            data: {
              adminUserId: user.id,
              roleId,
              assignedBy: adminUserId,
            },
          })
        )
      )
    }

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ADMIN_USER_CREATE,
      resource: 'admin_user',
      resourceId: user.id,
      details: { username, email, name, isSuperuser, roleIds },
    })

    return ApiResponse.success({ user }, 201)
  } catch (error: unknown) {
    console.error('Create admin user error:', error)

    // Handle specific errors from createAdminUser
    if (error instanceof Error) {
      if (error.message === 'USERNAME_EXISTS') {
        return await ApiResponse.adminError('username_exists', 400)
      }
      if (error.message === 'EMAIL_EXISTS') {
        return await ApiResponse.adminError('email_exists', 400)
      }
    }

    // Handle Prisma unique constraint errors (P2002) as a fallback
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
