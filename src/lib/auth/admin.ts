import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { AdminUser } from '@/types/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { hasAnyPermission } from '@/lib/auth/rbac'

import { cookies } from 'next/headers'

/**
 * Check if current user is an admin (has admin-token cookie)
 */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  return !!cookieStore.get('admin-token')?.value
}

/**
 * Require admin authentication and optional permission(s)
 */
export async function requireAdminAuth(req: NextRequest, permission?: string | string[]) {
  const adminUserId = req.headers.get('x-admin-user-id')

  if (!adminUserId) {
    return { error: await ApiResponse.adminError('unauthorized', 401) }
  }

  if (permission) {
    const permissions = typeof permission === 'string' ? [permission] : permission
    if (!(await hasAnyPermission(adminUserId, permissions))) {
      return { error: await ApiResponse.adminError('forbidden', 403) }
    }
  }

  return { adminUserId }
}

/**
 * Admin login with username and password
 */
export async function adminLogin({
  username,
  password,
}: {
  username: string
  password: string
}): Promise<AdminUser> {
  // Find admin user
  const adminUser = await prisma.adminUser.findUnique({
    where: { username },
  })

  if (!adminUser) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // Check if account is active
  if (!adminUser.isActive) {
    throw new Error('ACCOUNT_DISABLED')
  }

  // Verify password
  const isValid = await verifyPassword(password, adminUser.password)

  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // Update last login time
  await prisma.adminUser.update({
    where: { id: adminUser.id },
    data: { lastLoginAt: new Date() },
  })

  // Log audit
  await logAudit({
    adminUserId: adminUser.id,
    action: AUDIT_ACTIONS.ADMIN_LOGIN_SUCCESS,
    resource: 'admin_user',
    resourceId: adminUser.id,
  })

  return {
    id: adminUser.id,
    username: adminUser.username,
    email: adminUser.email,
    name: adminUser.name,
    avatar: adminUser.avatar,
    isSuperuser: adminUser.isSuperuser,
    isActive: adminUser.isActive,
    lastLoginAt: adminUser.lastLoginAt,
  }
}

/**
 * Create admin user
 */
export async function createAdminUser({
  username,
  email,
  password,
  name,
  isSuperuser = false,
  assignDefaultRole = true,
}: {
  username: string
  email: string
  password: string
  name?: string
  isSuperuser?: boolean
  assignDefaultRole?: boolean
}) {
  // Check if username already exists
  const existingUsername = await prisma.adminUser.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive',
      },
    },
  })
  if (existingUsername) {
    throw new Error('USERNAME_EXISTS')
  }

  // Check if email already exists
  const existingEmail = await prisma.adminUser.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
    },
  })
  if (existingEmail) {
    throw new Error('EMAIL_EXISTS')
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create admin user
  const adminUser = await prisma.adminUser.create({
    data: {
      username,
      email,
      password: hashedPassword,
      name,
      isSuperuser,
    },
  })

  // Assign default role if requested and not superuser
  if (assignDefaultRole && !isSuperuser) {
    const defaultRole = await prisma.adminRole.findFirst({
      where: { isDefault: true },
    })

    if (defaultRole) {
      await prisma.adminUserRole.create({
        data: {
          adminUserId: adminUser.id,
          roleId: defaultRole.id,
        },
      })
    }
  }

  return adminUser
}

/**
 * Get admin user by ID
 */
export async function getAdminUserById(adminUserId: string): Promise<AdminUser | null> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      isSuperuser: true,
      isActive: true,
      lastLoginAt: true,
    },
  })

  return adminUser
}

/**
 * Get admin user by username
 */
export async function getAdminUserByUsername(username: string): Promise<AdminUser | null> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      isSuperuser: true,
      isActive: true,
      lastLoginAt: true,
    },
  })

  return adminUser
}
