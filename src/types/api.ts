// Admin Auth Types
export type AdminLoginBody = {
  username: string // Admin username
  password: string // Admin password
}

// Product Types
export type ProductQueryParams = {
  page?: number // Page number (default: 1)
  pageSize?: number // Items per page (default: 10)
  search?: string // Search by product name or slug
  status?: 'active' | 'inactive' // Filter by status
}

export type CreateProductBody = {
  name: string // Product name
  description?: string // Product description
  content?: string // Product content (rich text)
  image?: string // Product image URL
  slug: string // URL slug
  price: number // Price in cents
  currency?: string // Currency code (default: usd)
  quantity?: number // Stock quantity (null means unlimited)
  isActive?: boolean // Active status
  metadata?: string // Additional metadata (JSON string)
}

export type UpdateProductBody = {
  name?: string // Product name
  description?: string // Product description
  content?: string // Product content (rich text)
  image?: string // Product image URL
  slug?: string // URL slug
  price?: number // Price in cents
  currency?: string // Currency code
  quantity?: number // Stock quantity (null means unlimited)
  isActive?: boolean // Active status
  metadata?: string // Additional metadata (JSON string)
}

// User Profile Types
export type UpdateUserProfileBody = {
  name?: string // User display name (2-50 characters)
  image?: string // Profile image URL
}

export type UpdatePasswordBody = {
  currentPassword?: string // Current password (required if password exists)
  newPassword: string // New password (min 8 characters)
}

// Order Types
export type OrderQueryParams = {
  page?: number // Page number (default: 1)
  pageSize?: number // Items per page (default: 10)
  status?: string // Filter by order status
  paymentProvider?: string // Filter by payment provider
  search?: string // Search query
  export?: boolean // Export all orders without pagination
}

// Member Types
export type MemberQueryParams = {
  page?: number // Page number (default: 1)
  pageSize?: number // Items per page (default: 10)
  search?: string // Search by name or email
  status?: 'active' | 'inactive' // Filter by status
}

// Auth Registration Types
export type SendVerificationCodeBody = {
  email: string // Email address
}

export type VerifyCodeBody = {
  email: string // Email address
  code: string // Verification code
}

export type CompleteRegistrationBody = {
  token: string // Verification token
  name: string // User name
  password: string // Password
  avatarUrl?: string // Avatar URL
}

// Role Types
export type CreateRoleBody = {
  name: string // Role name
  description?: string // Role description
  isDefault?: boolean // Is default role
  permissionIds?: string[] // Permission IDs to assign
}

export type UpdateRoleBody = {
  name?: string // Role name
  description?: string // Role description
  isDefault?: boolean // Is default role
  permissionIds?: string[] // Permission IDs to assign
}

// Permission Types
export type CreatePermissionBody = {
  code: string // Permission code
  name: string // Permission name
  description?: string // Permission description
  resource: string // Resource type
  action: string // Action type
}

// Admin User Types
export type CreateAdminUserBody = {
  username: string // Username
  email: string // Email address
  password: string // Password
  name?: string // Display name
  isSuperuser?: boolean // Is superuser
  roleIds?: string[] // Role IDs to assign
}

export type UpdateAdminUserBody = {
  username?: string // Username
  email?: string // Email address
  password?: string // Password
  name?: string // Display name
  avatar?: string // Avatar URL
  isActive?: boolean // Active status
  roleIds?: string[] // Role IDs to assign
}

// Post Types
export type PostQueryParams = {
  type?: 'ARTICLE' | 'PAGE' // Post type
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'TRASH' // Post status
  categoryId?: string // Category ID
  tagId?: string // Tag ID
  search?: string // Search query
  page?: number // Page number
  pageSize?: number // Items per page
}

export type CreatePostBody = {
  title: string // Post title
  slug: string // URL slug
  type?: 'ARTICLE' | 'PAGE' // Post type
  content?: string // Post content
  excerpt?: string // Post excerpt
  featuredImage?: string // Featured image URL
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'TRASH' // Post status
  publishedAt?: Date | string | null
  categoryIds?: string[] // Category IDs
  tagNames?: string[] // Tag names
}

// Category Types
export type CreateCategoryBody = {
  name: string // Category name
  description?: string // Category description
  parentId?: string // Parent category ID (optional, max 3 levels deep)
}

// Payment Types
export type CreateCheckoutBody = {
  productId: string // Product ID
  paymentMethodId: string // Payment method ID
  quantity?: number // Quantity (default: 1)
  successUrl?: string // Success redirect URL
  cancelUrl?: string // Cancel redirect URL
  paymentProvider?: 'stripe' | 'paypal' // Payment provider
}

export type CaptureOrderBody = {
  orderId: string // PayPal order ID
}

// Audit Log Types
export type AuditLogQueryParams = {
  adminUserId?: string // Filter by admin user ID
  action?: string // Filter by action
  resource?: string // Filter by resource type
  startDate?: string // Start date (ISO format)
  endDate?: string // End date (ISO format)
  page?: number // Page number
  pageSize?: number // Items per page
}

// Member Update Types
export type UpdateMemberStatusBody = {
  isActive: boolean // Active status
}

export type UpdateMemberPasswordBody = {
  password: string // New password
}

// Payment Method Types
export type CreatePaymentMethodBody = {
  provider: 'stripe' | 'paypal' // Payment provider
  stripePriceId?: string // Stripe price ID
  stripeProductId?: string // Stripe product ID
  paypalPlanId?: string // PayPal plan ID
  paypalProductId?: string // PayPal product ID
  mode?: 'payment' | 'subscription' // Payment mode
  interval?: 'day' | 'week' | 'month' | 'year' // Subscription interval
  intervalCount?: number // Interval count
  isActive?: boolean // Active status
  metadata?: string // Additional metadata (JSON string)
}

export type UpdatePaymentMethodBody = {
  stripePriceId?: string // Stripe price ID
  stripeProductId?: string // Stripe product ID
  paypalPlanId?: string // PayPal plan ID
  paypalProductId?: string // PayPal product ID
  mode?: 'payment' | 'subscription' // Payment mode
  interval?: 'day' | 'week' | 'month' | 'year' // Subscription interval
  intervalCount?: number // Interval count
  isActive?: boolean // Active status
  metadata?: string // Additional metadata (JSON string)
}

// Post Update Types
export type UpdatePostBody = {
  title?: string // Post title
  slug?: string // URL slug
  content?: string // Post content
  excerpt?: string // Post excerpt
  featuredImage?: string // Featured image URL
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'TRASH' // Post status
  categoryIds?: string[] // Category IDs
  tagNames?: string[] // Tag names
}

// Role Permission Types
export type AssignRolePermissionsBody = {
  permissionIds: string[] // Permission IDs to assign
}

// Admin User Role Types
export type AssignAdminUserRolesBody = {
  roleIds: string[] // Role IDs to assign
}

// Order Status Types
export type UpdateOrderStatusBody = {
  status: string // Order status
}

// API Response Types
export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  message?: string
}

export type UseApiOptions<T = unknown> = {
  urlOverride?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  transform?: (data: T) => T
  onSuccess?: (result: ApiResponse<T>) => void
  onError?: (error: string) => void
}

// Public Post Query Types
export type PublicPostQueryParams = {
  page?: number // Page number
  pageSize?: number // Items per page
  search?: string // Search query
  categoryId?: string // Category ID
  tagId?: string // Tag ID
}

// Permission Update Types
export type UpdatePermissionBody = {
  name: string // Permission name
  description?: string // Permission description
  resource: string // Resource type
  action: string // Action type
}

// Price ID Check Types
export type CheckPriceIdParams = {
  stripePriceId?: string // Stripe price ID to check
  paypalPlanId?: string // PayPal plan ID to check
}
