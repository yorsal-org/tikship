/**
 * Admin-related type definitions
 */
import { Category } from './post'

/**
 * Base admin user interface
 */
export interface AdminUser {
  id: string
  username: string
  email: string
  name: string | null
  avatar: string | null
  isSuperuser: boolean
  isActive: boolean
  lastLoginAt: Date | null
}

/**
 * Admin user with roles included
 */
export interface AdminUserWithRoles extends Omit<AdminUser, 'lastLoginAt'> {
  createdAt: string
  roles: Array<{
    role: {
      id: string
      name: string
    }
  }>
}

/**
 * Base role interface
 */
export interface Role {
  id: string
  name: string
  description: string | null
  isDefault: boolean
}

/**
 * Role with user and permission counts
 */
export interface RoleWithCounts extends Role {
  createdAt: string
  _count: {
    adminUsers: number
    permissions: number
  }
  permissions?: Array<{ permission: Permission }>
}

/**
 * Permission interface
 */
export interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  resource: string
  action: string
  isSystem: boolean
  createdAt: Date
}

/**
 * Audit log interface
 */
export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
  adminUser: {
    id: string
    username: string
    name: string | null
    email: string
  }
}

/**
 * Parameters for creating an audit log entry
 */
export interface AuditLogParams {
  adminUserId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Frontend user/member interface (for admin management)
 */
export interface Member {
  id: string
  name: string | null
  email: string | null
  image: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

/**
 * Detailed member information with accounts
 */
export interface MemberDetails extends Member {
  emailVerified: string | null
  accounts: Array<{
    provider: string
  }>
  _count: {
    loginAttempts: number
  }
}

/**
 * Member statistics data
 */
export interface MemberStats {
  totalUsers: number
  newToday: number
  active7d: number
  conversionRate: number
}

/**
 * Members list API response
 */
export interface MembersListResponse {
  users: Member[]
  page: number
  total: number
  totalPages: number
}

/**
 * Audit logs list API response
 */
export interface AuditLogsListResponse {
  logs: AuditLog[]
  page: number
  total: number
  totalPages: number
}

/**
 * Admin users list API response
 */
export interface AdminUsersListResponse {
  users: AdminUserWithRoles[]
  page: number
  total: number
  totalPages: number
}

/**
 * Roles list API response
 */
export interface RolesListResponse {
  roles: RoleWithCounts[]
}

/**
 * Permissions list API response
 */
export interface PermissionsListResponse {
  permissions: Permission[]
}

/**
 * Role detail API response
 */
export interface RoleDetailResponse {
  role: RoleWithCounts
}

/**
 * Categories list API response (flat list)
 */
export interface CategoriesListResponse {
  categories: Array<Category & { _count?: { posts: number } }>
}

/**
 * Categories tree API response (hierarchical)
 */
export interface CategoriesTreeResponse {
  categories: Array<
    Category & {
      _count?: { posts: number }
      children: Array<
        Category & {
          _count?: { posts: number }
          children: Array<Category & { _count?: { posts: number }; children: [] }>
        }
      >
    }
  >
}

/**
 * Member detail API response
 */
export interface MemberDetailResponse {
  user: MemberDetails
}



/**
 * Permission definition from config
 */
export interface PermissionDefinition {
  code: string
  name: string
  description: string
}

/**
 * Permission group from config
 */
export interface PermissionGroup {
  name: string
  description?: string
  permissions: PermissionDefinition[]
}

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  adminUsers: {
    total: number
    active: number
  }
  roles: {
    total: number
    default: number
  }
  permissions: {
    total: number
  }
  auditLogs: {
    total: number
    recent: number
  }
  members: {
    total: number
    newToday: number
    activeLast7Days: number
  }
  products: {
    total: number
    active: number
  }
  orders: {
    total: number
    completed: number
    pending: number
    failed: number
  }
  revenue: {
    byCurrency: Array<{ currency: string; amount: number }>
    lastMonth: Array<{ currency: string; amount: number }>
  }
  charts: {
    userGrowth: Array<{ date: string; count: number }>
    orderTrend: Array<{
      date: string
      count: number
      revenueByCurrency: Array<{ currency: string; amount: number }>
    }>
  }
}
