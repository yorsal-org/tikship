// Load environment variables
import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { hashPassword } from '../src/lib/utils/password'
import { ALL_PERMISSIONS } from '../prisma/data/permissionGroup'

export async function seed() {
  console.log('🌱 Starting database seeding...')

  // 1. Create all permissions
  console.log('📝 Creating permissions...')
  for (const permission of ALL_PERMISSIONS) {
    await prisma.adminPermission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        isSystem: true,
      },
      create: {
        code: permission.code,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        isSystem: true,
      },
    })
  }
  console.log(`✅ Created ${ALL_PERMISSIONS.length} permissions`)

  // 2. Create default Admin role with basic permissions
  console.log('👤 Creating default Admin role...')
  const adminRole = await prisma.adminRole.upsert({
    where: { name: 'Admin' },
    update: {
      description: 'Default administrator with basic permissions',
      isDefault: true,
    },
    create: {
      name: 'Admin',
      description: 'Default administrator with basic permissions',
      isDefault: true,
    },
  })

  // Assign admin user permissions to Admin role
  const basicPermissionCodes = [
    'admin_user:view',
    'admin_user:create',
    'admin_user:edit',
    'admin_user:delete',
    'admin_user:assign_role',
    'role:view',
    'role:create',
    'role:edit',
    'role:delete',
    'role:assign_permission',
    'permission:view',
    'permission:create',
    'permission:edit',
    'permission:delete',
    'audit_log:view',
    'audit_log:delete',
    'user:view',
    'user:edit',
    'user:delete',
    'article:view',
    'article:create',
    'article:edit',
    'article:delete',
    'page:view',
    'page:create',
    'page:edit',
    'page:delete',
    'product:view',
    'product:create',
    'product:edit',
    'order:view',
    'order:edit',
    'comment:manage',
    'settings:view',
    'settings:edit'
  ]

  const basicPermissions = await prisma.adminPermission.findMany({
    where: { code: { in: basicPermissionCodes } },
  })

  for (const permission of basicPermissions) {
    await prisma.adminRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    })
  }
  console.log(`✅ Admin role created with ${basicPermissions.length} permissions`)

  // 3. Create first superuser account
  // NOTE: Superusers don't need roles - they get all permissions via isSuperuser flag
  const adminUsername = process.env.ADMIN_USERNAME || 'tikship'
  const adminEmail = process.env.ADMIN_EMAIL || 'tikship@example.com'
  const adminName = process.env.ADMIN_NAME || 'Super Administrator'

  // Generate a random 8-character password if not provided in env
  const generateRandomPassword = (length = 8) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'
    let password = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }
    return password
  }

  const adminPassword = generateRandomPassword()

  console.log('🔐 Creating superuser account...')

  // Check if superuser already exists
  const existingSuperuser = await prisma.adminUser.findFirst({
    where: {
      OR: [{ username: adminUsername }, { email: adminEmail }],
    },
  })

  if (existingSuperuser) {
    console.log(
      `⚠️  Superuser with username '${adminUsername}' or email '${adminEmail}' already exists, skipping...`
    )
    return {
      adminUsername,
      adminEmail,
      adminPassword: 'Password already set',
    }
  } else {
    const hashedPassword = await hashPassword(adminPassword)

    await prisma.adminUser.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        isSuperuser: true,
        isActive: true,
      },
    })

    console.log(`✅ Superuser created:`)
    console.log(`   Username: ${adminUsername}`)
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)

    return {
      adminUsername,
      adminEmail,
      adminPassword,
    }
  }
}

// Check if this script is being run directly
const isMain =
  process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))

if (isMain) {
  seed()
    .catch(e => {
      console.error('❌ Error seeding database:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
