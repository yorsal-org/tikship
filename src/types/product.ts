/**
 * Product-related type definitions
 */

/**
 * Product interface
 */
export interface Product {
  id: string
  name: string
  description?: string | null
  content?: string | null
  image?: string | null
  slug: string
  price: number
  currency: string
  quantity?: number | null
  isActive: boolean
  metadata?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Payment Method interface
 */
export interface PaymentMethod {
  id: string
  productId: string
  provider: string
  stripePriceId?: string | null
  stripeProductId?: string | null
  paypalPlanId?: string | null
  paypalProductId?: string | null
  mode: string
  interval?: string | null
  intervalCount?: number | null
  isActive: boolean
  metadata?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Product statistics data
 */
export interface ProductStats {
  total: number
  active: number
  inactive: number
  totalRevenueByCurrency: Array<{ currency: string; amount: number }>
}

/**
 * Product creation/update input
 */
export interface ProductInput {
  name: string
  description?: string | null
  content?: string | null
  image?: string | null
  slug: string
  price: number
  currency?: string
  quantity?: number | null
  isActive?: boolean
  metadata?: string | null
}

/**
 * Payment Method creation/update input
 */
export interface PaymentMethodInput {
  provider: string
  stripePriceId?: string | null
  stripeProductId?: string | null
  paypalPlanId?: string | null
  paypalProductId?: string | null
  mode?: string
  interval?: string | null
  intervalCount?: number | null
  isActive?: boolean
  metadata?: string | null
}

/**
 * Product filter parameters
 */
export interface ProductFilters {
  search?: string
  isActive?: boolean
}

/**
 * Products list API response
 */
export interface ProductsListResponse {
  products: Product[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Check price ID response
 */
export interface CheckPriceIdResponse {
  exists: boolean
}
