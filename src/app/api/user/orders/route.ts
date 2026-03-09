import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse } from '@/lib/utils/api-response'
import { getAuthenticatedUser } from '@/lib/auth/utils'


/**
 * Get user orders
 * @description Retrieve the current user's order history with pagination and filtering
 * @tag User - Orders
 * @auth sessionAuth
 * @params OrderQueryParams
 * @response 200:Returns paginated list of user orders
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user (supports Bearer Token and Session)
    const user = await getAuthenticatedUser(req)

    if (!user) {
      return ApiResponse.error('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * pageSize

    // Build where clause
    interface WhereClause {
      userId: string
      status?: string
    }

    const where: WhereClause = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              price: true,
              currency: true,
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
        pageSize: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Get user orders error:', error)
    return ApiResponse.error('Failed to fetch orders', 500)
  }
}
