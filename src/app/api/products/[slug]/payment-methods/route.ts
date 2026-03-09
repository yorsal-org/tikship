import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse } from '@/lib/utils/api-response'

/**
 * Get payment methods for a product by slug
 * @description Retrieve active payment methods for a specific product
 * @tag Products
 * @response 200:Returns list of payment methods
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

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return ApiResponse.success({ paymentMethods })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return ApiResponse.error('Failed to fetch payment methods', 500)
  }
}
