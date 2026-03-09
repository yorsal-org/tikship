import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse } from '@/lib/utils/api-response'

/**
 * Get active products list
 * @description Retrieve list of active products for public display
 * @tag Public - Products
 * @response 200:Returns list of active products
 * @responseSet public
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '12')

    // Build where clause - only return active products
    const where = {
      isActive: true,
    }

    // Get total count
    const totalCount = await prisma.product.count({ where })

    // Get paginated products
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        slug: true,
        price: true,
        currency: true,
        quantity: true,
        createdAt: true,
      },
    })

    return ApiResponse.success({
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    })
  } catch (error) {
    console.error('Get products error:', error)
    return ApiResponse.error('Failed to fetch products', 500)
  }
}
