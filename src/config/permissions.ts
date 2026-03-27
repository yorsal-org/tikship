export const PERMISSIONS = {
  // Admin User Management
  ADMIN_USER_VIEW: 'admin_user:view',
  ADMIN_USER_CREATE: 'admin_user:create',
  ADMIN_USER_EDIT: 'admin_user:edit',
  ADMIN_USER_DELETE: 'admin_user:delete',
  ADMIN_USER_ASSIGN_ROLE: 'admin_user:assign_role',

  // Role Management
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_EDIT: 'role:edit',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN_PERMISSION: 'role:assign_permission',

  // Permission Management
  PERMISSION_VIEW: 'permission:view',
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_EDIT: 'permission:edit',
  PERMISSION_DELETE: 'permission:delete',

  // Audit Log
  AUDIT_LOG_VIEW: 'audit_log:view',
  AUDIT_LOG_DELETE: 'audit_log:delete',

  // Frontend User Management (for admin to manage frontend users)
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',

  // Content Management
  ARTICLE_VIEW: 'article:view',
  ARTICLE_CREATE: 'article:create',
  ARTICLE_EDIT: 'article:edit',
  ARTICLE_DELETE: 'article:delete',

  PAGE_VIEW: 'page:view',
  PAGE_CREATE: 'page:create',
  PAGE_EDIT: 'page:edit',
  PAGE_DELETE: 'page:delete',

  // Product Management
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_EDIT: 'product:edit',

  // Order Management
  ORDER_VIEW: 'order:view',
  ORDER_EDIT: 'order:edit',
} as const
