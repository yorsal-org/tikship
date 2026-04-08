import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword, verifyPassword } from '@/lib/utils/password'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { AdminUser } from '@/types/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { hasAnyPermission } from '@/lib/admin/rbac'
import { PERMISSIONS } from '@/config/permissions'

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

// ---------------------------------------------------------------------------
// Admin User Service — business logic for route handlers
// ---------------------------------------------------------------------------

export interface ListAdminUsersParams {
  search?: string
  page: number
  pageSize: number
}

export interface ListAdminUsersResult {
  users: Array<{
    id: string
    username: string
    email: string
    name: string | null
    avatar: string | null
    isSuperuser: boolean
    isActive: boolean
    lastLoginAt: Date | null
    createdAt: Date
    roles: Array<{ role: { id: string; name: string } }>
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * List admin users with pagination and search
 */
export async function listAdminUsers({
  search,
  page,
  pageSize,
}: ListAdminUsersParams): Promise<ListAdminUsersResult> {
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

  return {
    users: users as unknown as ListAdminUsersResult['users'],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export interface CreateAdminUserWithRolesParams {
  username: string
  email: string
  password: string
  name?: string
  isSuperuser?: boolean
  roleIds?: string[]
  assignedBy?: string
}

/**
 * Create admin user and optionally assign roles
 * Throws: 'USERNAME_EXISTS' | 'EMAIL_EXISTS'
 */
export async function createAdminUserWithRoles({
  username,
  email,
  password,
  name,
  isSuperuser = false,
  roleIds,
  assignedBy,
}: CreateAdminUserWithRolesParams) {
  const user = await createAdminUser({
    username,
    email,
    password,
    name,
    isSuperuser,
    assignDefaultRole: !roleIds || roleIds.length === 0,
  })

  if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
    await Promise.all(
      roleIds.map((roleId: string) =>
        prisma.adminUserRole.create({
          data: {
            adminUserId: user.id,
            roleId,
            assignedBy: assignedBy || null,
          },
        })
      )
    )
  }

  return user
}

export type BulkAdminUserAction = 'activate' | 'deactivate' | 'delete'

export interface BulkAdminUsersParams {
  ids: string[]
  action: BulkAdminUserAction
  actorId: string
}

/**
 * Bulk update (activate/deactivate/delete) admin users
 * Returns affected count and skips protected users (superuser/self)
 */
export async function bulkAdminUsers({
  ids,
  action,
  actorId,
}: BulkAdminUsersParams): Promise<{ count: number }> {
  // Never touch superusers or the current user
  const safeIds = (ids as string[]).filter(id => id !== actorId)
  const superusers = await prisma.adminUser.findMany({
    where: { id: { in: safeIds }, isSuperuser: true },
    select: { id: true },
  })
  const superuserIds = new Set(superusers.map(u => u.id))
  const targetIds = safeIds.filter(id => !superuserIds.has(id))

  if (targetIds.length === 0) {
    throw new Error('NO_TARGET_USERS')
  }

  if (action === 'delete') {
    // Only allow deleting disabled non-superuser admins
    const adminsToDelete = await prisma.adminUser.findMany({
      where: { id: { in: targetIds } },
      select: { id: true, isActive: true, isSuperuser: true },
    })

    const invalidAdmins = adminsToDelete.filter(a => a.isActive || a.isSuperuser)
    if (invalidAdmins.length > 0) {
      throw new Error('CANNOT_DELETE_ACTIVE_OR_SUPERUSER')
    }

    const { count } = await prisma.adminUser.deleteMany({
      where: { id: { in: targetIds }, isActive: false, isSuperuser: false },
    })

    await logAudit({
      adminUserId: actorId,
      action: AUDIT_ACTIONS.ADMIN_USER_DELETE,
      resource: 'admin_user',
      details: { ids: targetIds, bulkCount: count },
    })

    return { count }
  }

  const isActive = action === 'activate'
  const { count } = await prisma.adminUser.updateMany({
    where: { id: { in: targetIds } },
    data: { isActive },
  })

  await logAudit({
    adminUserId: actorId,
    action: isActive ? AUDIT_ACTIONS.ADMIN_USER_ACTIVATE : AUDIT_ACTIONS.ADMIN_USER_DEACTIVATE,
    resource: 'admin_user',
    details: { ids: targetIds, isActive, bulkCount: count },
  })

  return { count }
}
