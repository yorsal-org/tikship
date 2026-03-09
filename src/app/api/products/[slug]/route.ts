import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse } from '@/lib/utils/api-response'

/**
 * Get product by slug
 * @description Retrieve product details by slug for public viewing
 * @tag Products
 * @response 200:Returns product details
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
    })

    if (!product) {
      return ApiResponse.error('Product not found', 404)
    }

    return ApiResponse.success({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return ApiResponse.error('Failed to fetch product', 500)
  }
}
