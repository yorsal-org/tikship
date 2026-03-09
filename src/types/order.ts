/**
 * Order-related type definitions
 */

/**
 * Order interface
 */
export interface Order {
  id: string
  userId?: string | null
  productId: string
  paymentProvider: string
  stripeSessionId?: string | null
  stripeCustomerId?: string | null
  paypalOrderId?: string | null
  paypalSubscriptionId?: string | null
  status: string
  amount: number
  currency: string
  metadata?: string | null
  createdAt: string
  updatedAt: string
  product: {
    id: string
    name: string
    image?: string | null
    description?: string | null
  }
  user?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
}

/**
 * Order statistics data
 */
export interface OrderStats {
  total: number
  completed: number
  pending: number
  failed: number
  totalRevenueByCurrency: Array<{ currency: string; amount: number }>
}

/**
 * Order status enum
 */
export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

/**
 * Order filter parameters
 */
export interface OrderFilters {
  search?: string
  status?: string
  userId?: string
  productId?: string
  startDate?: string
  endDate?: string
}

/**
 * Order update input
 */
export interface OrderUpdateInput {
  status?: string
  metadata?: string | null
}

/**
 * Orders list API response
 */
export interface OrdersListResponse {
  orders: Order[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Posts list API response
 */
export interface PostsListResponse {
  items: Post[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Import Post from post types
import { Post } from './post'
