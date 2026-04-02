import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { hashPassword } from '@/lib/utils/password'
import { checkPasswordStrength } from '@/lib/utils/validators'
import { siteConfig } from '@/config/site'
import type { UpdateAdminUserBody } from '@/types/api'

/**
 * Get admin user details
 * @description Get admin user details with roles and permissions
 * @tag Admin - Users
 * @auth bearerAuth
 * @response 200:Returns admin user details
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_VIEW)
    if (error) return error

    const user = await prisma.adminUser.findUnique({
      where: { id },
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
        updatedAt: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return await ApiResponse.adminError('user_not_found', 404)
    }

    return ApiResponse.success({ user })
  } catch (error) {
    console.error('Get admin user error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Update admin user
 * @description Update admin user information
 * @tag Admin - Users
 * @auth bearerAuth
 * @body UpdateAdminUserBody
 * @response 200:Admin user updated successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_EDIT)
    if (error) return error

    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { username, email, name, avatar, isActive, password } =
      (await req.json()) as UpdateAdminUserBody

    // Check if target user is superuser
    const existingUser = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, isSuperuser: true, username: true, email: true },
    })

    if (!existingUser) {
      return await ApiResponse.adminError('user_not_found', 404)
    }

    // Prevent modifying superuser by others
    if (existingUser.isSuperuser && adminUserId !== id) {
      return await ApiResponse.adminError('cannot_modify_superuser', 403)
    }

    const updateData: {
      username?: string
      email?: string
      name?: string
      avatar?: string
      isActive?: boolean
      password?: string
    } = {}

    if (username) {
      if (username !== existingUser.username) {
        const duplicateUsername = await prisma.adminUser.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
        })
        if (duplicateUsername) {
          return await ApiResponse.adminError('username_exists', 400)
        }
      }
      updateData.username = username
    }

    if (email) {
      if (email !== existingUser.email) {
        const duplicateEmail = await prisma.adminUser.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        })
        if (duplicateEmail) {
          return await ApiResponse.adminError('email_exists', 400)
        }
      }
      updateData.email = email
    }

    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) {
      // Validate password strength
      const minStrength = siteConfig.admin.password.minStrength as 'weak' | 'medium' | 'strong'
      const { isValid } = checkPasswordStrength(password, minStrength)

      if (!isValid) {
        return await ApiResponse.adminError('password_too_weak', 400)
      }

      updateData.password = await hashPassword(password)
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: updateData,
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
        updatedAt: true,
      },
    })

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ADMIN_USER_UPDATE,
      resource: 'admin_user',
      resourceId: id,
      details: { username, email, name, isActive },
    })

    return ApiResponse.success({ user })
  } catch (error) {
    console.error('Update admin user error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Update admin user with roles
 * @description Update admin user information including roles
 * @tag Admin - Users
 * @auth bearerAuth
 * @body UpdateAdminUserBody
 * @response 200:Admin user updated successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_EDIT)
    if (error) return error

    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    // Check if user is superuser
    const existingUser = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, isSuperuser: true, username: true, email: true },
    })

    if (!existingUser) {
      return await ApiResponse.adminError('user_not_found', 404)
    }

    // Prevent modifying superuser by others
    if (existingUser.isSuperuser && adminUserId !== id) {
      return await ApiResponse.adminError('cannot_modify_superuser', 403)
    }

    const { username, email, name, isActive, password, roleIds } =
      (await req.json()) as UpdateAdminUserBody

    const updateData: {
      username?: string
      email?: string
      name?: string | null
      isActive?: boolean
      password?: string
    } = {}

    if (username) {
      if (username !== existingUser.username) {
        const duplicateUsername = await prisma.adminUser.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
        })
        if (duplicateUsername) {
          return await ApiResponse.adminError('username_exists', 400)
        }
      }
      updateData.username = username
    }

    if (email) {
      if (email !== existingUser.email) {
        const duplicateEmail = await prisma.adminUser.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        })
        if (duplicateEmail) {
          return await ApiResponse.adminError('email_exists', 400)
        }
      }
      updateData.email = email
    }

    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) {
      // Validate password strength
      const minStrength = siteConfig.admin.password.minStrength as 'weak' | 'medium' | 'strong'
      const { isValid } = checkPasswordStrength(password, minStrength)

      if (!isValid) {
        return await ApiResponse.adminError('password_too_weak', 400)
      }

      updateData.password = await hashPassword(password)
    }

    // Update user
    const user = await prisma.adminUser.update({
      where: { id },
      data: updateData,
    })

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      // Remove existing roles
      await prisma.adminUserRole.deleteMany({
        where: { adminUserId: id },
      })

      // Add new roles
      if (roleIds.length > 0) {
        await Promise.all(
          roleIds.map((roleId: string) =>
            prisma.adminUserRole.create({
              data: {
                adminUserId: id,
                roleId,
                assignedBy: adminUserId,
              },
            })
          )
        )
      }
    }

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ADMIN_USER_UPDATE,
      resource: 'admin_user',
      resourceId: id,
      details: { username, email, name, isActive, roleIds },
    })

    return ApiResponse.success({ user })
  } catch (error) {
    console.error('Update admin user error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Delete admin user
 * @description Delete an admin user (cannot delete self or superuser)
 * @tag Admin - Users
 * @auth bearerAuth
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_DELETE)
    if (error) return error

    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    // Prevent self-deletion
    if (id === adminUserId) {
      return await ApiResponse.adminError('cannot_delete_self', 400)
    }

    // Check if target user is superuser
    const targetUser = await prisma.adminUser.findUnique({
      where: { id },
      select: { isSuperuser: true },
    })

    if (!targetUser) {
      return await ApiResponse.adminError('user_not_found', 404)
    }

    // Prevent deleting superuser
    if (targetUser.isSuperuser) {
      return await ApiResponse.adminError('cannot_delete_superuser', 403)
    }

    await prisma.adminUser.delete({
      where: { id },
    })

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.ADMIN_USER_DELETE,
      resource: 'admin_user',
      resourceId: id,
    })

    return ApiResponse.success({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete admin user error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
