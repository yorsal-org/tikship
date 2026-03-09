import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'


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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status') || ''
    const paymentProvider = searchParams.get('paymentProvider') || ''
    const search = searchParams.get('search') || ''
    const isExport = searchParams.get('export') === 'true'
    const skip = (page - 1) * limit

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
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { stripeSessionId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // For export, get all matching orders without pagination
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
