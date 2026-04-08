import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { getModuleState } from '@/lib/module-state'
import { parsePagination } from '@/lib/utils/pagination'

type OrderBulkAction = 'completed' | 'failed' | 'refunded' | 'delete'


/**
 * Get orders list
 * @description Retrieve paginated list of orders with filtering and search options
 * @tag Admin - Orders
 * @auth bearerAuth
 * @params OrderQueryParams
 * @response 200:Returns paginated list of orders
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ORDER_VIEW)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const { page, pageSize: limit } = parsePagination(
      searchParams.get('page'),
      searchParams.get('pageSize'),
      { defaultPageSize: 10 }
    )
    const status = searchParams.get('status') || ''
    const paymentProvider = searchParams.get('paymentProvider') || ''
    const search = searchParams.get('search') || ''
    const isExport = searchParams.get('export') === 'true'
    const skip = (page - 1) * limit

    // Check module state for conditional user relation
    const moduleState = getModuleState()

    // Build where clause
    interface WhereClause {
      status?: string
      paymentProvider?: string
      OR?: Array<{
        id?: { contains: string; mode: 'insensitive' }
        stripeSessionId?: { contains: string; mode: 'insensitive' }
        user?: {
          email?: { contains: string; mode: 'insensitive' }
          name?: { contains: string; mode: 'insensitive' }
        }
        product?: { name?: { contains: string; mode: 'insensitive' } }
      }>
    }

    const where: WhereClause = {}

    if (status) {
      where.status = status
    }
    if (paymentProvider) {
      where.paymentProvider = paymentProvider
    }
    if (search) {
      const searchConditions: WhereClause['OR'] = [
        { id: { contains: search, mode: 'insensitive' } },
        { stripeSessionId: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ]
      // Only search by user if user module is enabled
      if (moduleState.user) {
        searchConditions.push(
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } }
        )
      }
      where.OR = searchConditions
    }

    // For export, get all matching orders without pagination
    const userInclude = moduleState.user ? {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    } : {}

    if (isExport) {
      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          ...userInclude,
        },
      })

      return ApiResponse.success({ orders })
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              description: true,
            },
          },
          ...userInclude,
        },
      }),
      prisma.order.count({ where }),
    ])

    return ApiResponse.success({
      orders,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Bulk update/delete orders
 * @tag Admin - Orders
 * @auth bearerAuth
 * @openapi
 */
export async function PUT(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ORDER_EDIT)
    if (error) return error

    const body = await req.json() as { ids?: unknown; action?: unknown }
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0 || typeof action !== 'string') {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    const validActions: OrderBulkAction[] = ['completed', 'failed', 'refunded', 'delete']
    if (!validActions.includes(action as OrderBulkAction)) {
      return await ApiResponse.adminError('invalid_params', 400)
    }

    const bulkAction = action as OrderBulkAction
    const targetIds = ids as string[]

    if (bulkAction === 'delete') {
      // Only allow deleting failed orders
      const ordersToDelete = await prisma.order.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, status: true },
      })

      const nonFailedOrders = ordersToDelete.filter(o => o.status !== 'failed')
      if (nonFailedOrders.length > 0) {
        return await ApiResponse.adminError('cannot_delete_non_failed_order', 400)
      }

      const { count } = await prisma.order.deleteMany({
        where: { id: { in: targetIds }, status: 'failed' },
      })
      return ApiResponse.success({ count })
    }

    const { count } = await prisma.order.updateMany({
      where: { id: { in: targetIds } },
      data: { status: bulkAction },
    })

    return ApiResponse.success({ count })
  } catch (error) {
    console.error('Bulk update orders error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
