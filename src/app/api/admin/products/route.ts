import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'
import type { CreateProductBody } from '@/types/api'

/**
 * Get products list
 * @description Retrieve paginated list of products with filtering options
 * @tag Admin - Products
 * @auth bearerAuth
 * @params ProductQueryParams
 * @response 200:Returns paginated list of products
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_VIEW)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    // Build where clause
    interface WhereClause {
      OR?: Array<{
        name?: {
          contains: string
          mode: 'insensitive'
        }
        slug?: {
          contains: string
          mode: 'insensitive'
        }
      }>
      isActive?: boolean
    }

    const where: WhereClause = {}
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Filter by status (active/inactive)
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return ApiResponse.success({
      products,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get products error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Create product
 * @description Create a new product with pricing and payment method configuration
 * @tag Admin - Products
 * @auth bearerAuth
 * @body CreateProductBody
 * @response 201:Product created successfully
 * @responseSet auth
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_CREATE)
    if (error) return error

    const { name, description, content, image, slug, price, currency, quantity, isActive, metadata } =
      (await req.json()) as CreateProductBody

    // Validate required fields
    if (!name || !slug || !price) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    })

    if (existingProduct) {
      return await ApiResponse.adminError('invalid_input', 400)
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        content: content || null,
        image: image || null,
        slug,
        price: Number(price),
        currency: currency || 'usd',
        quantity: quantity !== undefined && quantity !== null ? Number(quantity) : null,
        isActive: isActive !== undefined ? isActive : true,
        metadata: metadata || null,
      },
    })

    // Log audit
    await logAudit({
      adminUserId,
      action: 'create',
      resource: 'product',
      resourceId: product.id,
      details: { name, slug, price, currency },
    })

    return ApiResponse.success({ product }, 201)
  } catch (error) {
    console.error('Create product error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
