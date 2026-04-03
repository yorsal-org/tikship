import { PERMISSIONS } from '@/config/permissions'
import { PermissionGroup } from '@/types/admin'

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Admin User Management',
    description: 'Manage admin users and their roles',
    permissions: [
      {
        code: PERMISSIONS.ADMIN_USER_VIEW,
        name: 'View Admin Users',
        description: 'View admin user list and details',
      },
      {
        code: PERMISSIONS.ADMIN_USER_CREATE,
        name: 'Create Admin Users',
        description: 'Create new admin users',
      },
      {
        code: PERMISSIONS.ADMIN_USER_EDIT,
        name: 'Edit Admin Users',
        description: 'Edit admin user information',
      },
      {
        code: PERMISSIONS.ADMIN_USER_DELETE,
        name: 'Delete Admin Users',
        description: 'Delete admin users',
      },
      {
        code: PERMISSIONS.ADMIN_USER_ASSIGN_ROLE,
        name: 'Assign Roles to Admin Users',
        description: 'Assign or remove roles from admin users',
      },
    ],
  },
  {
    name: 'Role Management',
    description: 'Manage roles and permissions',
    permissions: [
      {
        code: PERMISSIONS.ROLE_VIEW,
        name: 'View Roles',
        description: 'View role list and details',
      },
      {
        code: PERMISSIONS.ROLE_CREATE,
        name: 'Create Roles',
        description: 'Create new roles',
      },
      {
        code: PERMISSIONS.ROLE_EDIT,
        name: 'Edit Roles',
        description: 'Edit role information',
      },
      {
        code: PERMISSIONS.ROLE_DELETE,
        name: 'Delete Roles',
        description: 'Delete roles',
      },
      {
        code: PERMISSIONS.ROLE_ASSIGN_PERMISSION,
        name: 'Assign Permissions to Roles',
        description: 'Assign or remove permissions from roles',
      },
    ],
  },
  {
    name: 'Permission Management',
    description: 'Manage system permissions',
    permissions: [
      {
        code: PERMISSIONS.PERMISSION_VIEW,
        name: 'View Permissions',
        description: 'View all system permissions',
      },
      {
        code: PERMISSIONS.PERMISSION_CREATE,
        name: 'Create Permissions',
        description: 'Create custom permissions',
      },
      {
        code: PERMISSIONS.PERMISSION_EDIT,
        name: 'Edit Permissions',
        description: 'Edit custom permissions',
      },
      {
        code: PERMISSIONS.PERMISSION_DELETE,
        name: 'Delete Permissions',
        description: 'Delete custom permissions',
      },
    ],
  },
  {
    name: 'Audit Log',
    description: 'View system audit logs',
    permissions: [
      {
        code: PERMISSIONS.AUDIT_LOG_VIEW,
        name: 'View Audit Logs',
        description: 'View system operation logs',
      },
      {
        code: PERMISSIONS.AUDIT_LOG_DELETE,
        name: 'Delete Audit Logs',
        description: 'Delete system operation logs',
      },
    ],
  },
  {
    name: 'Frontend User Management',
    description: 'Manage frontend users',
    permissions: [
      {
        code: PERMISSIONS.USER_VIEW,
        name: 'View Users',
        description: 'View frontend user list and details',
      },
      {
        code: PERMISSIONS.USER_EDIT,
        name: 'Edit Users',
        description: 'Edit frontend user information',
      },
      {
        code: PERMISSIONS.USER_DELETE,
        name: 'Delete Users',
        description: 'Delete frontend users',
      },
    ],
  },
  {
    name: 'Content Management',
    description: 'Manage content (example)',
    permissions: [
      {
        code: PERMISSIONS.ARTICLE_VIEW,
        name: 'View Articles',
        description: 'View article list and details',
      },
      {
        code: PERMISSIONS.ARTICLE_CREATE,
        name: 'Create Articles',
        description: 'Create new articles',
      },
      {
        code: PERMISSIONS.ARTICLE_EDIT,
        name: 'Edit Articles',
        description: 'Edit article content',
      },
      {
        code: PERMISSIONS.ARTICLE_DELETE,
        name: 'Delete Articles',
        description: 'Delete articles',
      },
    ],
  },
  {
    name: 'Page Management',
    description: 'Manage pages',
    permissions: [
      {
        code: PERMISSIONS.PAGE_VIEW,
        name: 'View Pages',
        description: 'View page list and details',
      },
      {
        code: PERMISSIONS.PAGE_CREATE,
        name: 'Create Pages',
        description: 'Create new pages',
      },
      {
        code: PERMISSIONS.PAGE_EDIT,
        name: 'Edit Pages',
        description: 'Edit page content',
      },
      {
        code: PERMISSIONS.PAGE_DELETE,
        name: 'Delete Pages',
        description: 'Delete pages',
      },
    ],
  },
  {
    name: 'Product Management',
    description: 'Manage products',
    permissions: [
      {
        code: PERMISSIONS.PRODUCT_VIEW,
        name: 'View Products',
        description: 'View product list and details',
      },
      {
        code: PERMISSIONS.PRODUCT_CREATE,
        name: 'Create Products',
        description: 'Create new products',
      },
      {
        code: PERMISSIONS.PRODUCT_EDIT,
        name: 'Edit Products',
        description: 'Edit product information',
      },
    ],
  },
  {
    name: 'Order Management',
    description: 'Manage orders',
    permissions: [
      {
        code: PERMISSIONS.ORDER_VIEW,
        name: 'View Orders',
        description: 'View order list and details',
      },
      {
        code: PERMISSIONS.ORDER_EDIT,
        name: 'Edit Orders',
        description: 'Edit order information',
      },
    ],
  },
  {
    name: 'Social Management',
    description: 'Manage comments, replies, likes',
    permissions: [
      {
        code: PERMISSIONS.COMMENT_MANAGE,
        name: 'Manage Comments',
        description: 'View, approve, reject and delete comments and replies',
      },
    ],
  },
  {
    name: 'System Settings',
    description: 'Manage system settings',
    permissions: [
      {
        code: PERMISSIONS.SETTINGS_VIEW,
        name: 'View Settings',
        description: 'View system settings',
      },
      {
        code: PERMISSIONS.SETTINGS_EDIT,
        name: 'Edit Settings',
        description: 'Edit system settings including social, theme, payment and more',
      },
    ],
  },
]

// Get all permission definitions as flat array
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(group =>
  group.permissions.map(p => ({
    ...p,
    resource: p.code.split(':')[0],
    action: p.code.split(':')[1],
  }))
)
