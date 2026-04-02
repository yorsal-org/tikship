import { prisma } from '@/lib/db/prisma'

/**
 * Check if admin user has any of the specified permissions
 *
 * NOTE: Supports users with multiple roles (permission union).
 */
export async function hasAnyPermission(
  adminUserId: string,
  permissionCodes: string[]
): Promise<boolean> {
  // Check if user is superuser
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { isSuperuser: true, isActive: true },
  })

  if (!adminUser || !adminUser.isActive) {
    return false
  }

  // Superuser has all permissions
  if (adminUser.isSuperuser) {
    return true
  }

  // Check if user has any of the permissions through roles
  const permission = await prisma.adminPermission.findFirst({
    where: {
      code: { in: permissionCodes },
      roles: {
        some: {
          role: {
            adminUsers: {
              some: {
                adminUserId,
              },
            },
          },
        },
      },
    },
  })

  return !!permission
}

/**
 * Get all permissions for an admin user
 *
 * NOTE: If the user has multiple roles, this returns the union of permissions
 * from all their assigned roles.
 */
export async function getAdminPermissions(adminUserId: string): Promise<string[]> {
  // Check if user is superuser
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { isSuperuser: true, isActive: true },
  })

  if (!adminUser || !adminUser.isActive) {
    return []
  }

  // Superuser has all permissions
  if (adminUser.isSuperuser) {
    const allPermissions = await prisma.adminPermission.findMany({
      select: { code: true },
    })
    return allPermissions.map(p => p.code)
  }

  // Get permissions through roles
  const permissions = await prisma.adminPermission.findMany({
    where: {
      roles: {
        some: {
          role: {
            adminUsers: {
              some: {
                adminUserId,
              },
            },
          },
        },
      },
    },
    select: { code: true },
  })

  return permissions.map(p => p.code)
}

/**
 * Check if admin user is superuser
 */
export async function isSuperuser(adminUserId: string): Promise<boolean> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { isSuperuser: true, isActive: true },
  })

  return !!(adminUser?.isSuperuser && adminUser?.isActive)
}

/**
 * Get admin user with roles and permissions
 */
export async function getAdminUserWithPermissions(adminUserId: string) {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    include: {
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

  if (!adminUser) {
    return null
  }

  // Flatten permissions
  const permissions = adminUser.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission))

  // Remove duplicates
  const uniquePermissions = Array.from(new Map(permissions.map(p => [p.code, p])).values())

  return {
    ...adminUser,
    permissions: uniquePermissions,
  }
}
