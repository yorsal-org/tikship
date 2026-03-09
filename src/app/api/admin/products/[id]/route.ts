import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'
import type { UpdateProductBody } from '@/types/api'

/**
 * Get product details
 * @description Retrieve detailed information about a specific product
 * @tag Admin - Products
 * @auth bearerAuth
 * @response 200:Returns product details
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_VIEW)
    if (error) return error

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return await ApiResponse.adminError('not_found', 404)
    }

    return ApiResponse.success({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Update product
 * @description Update product information including pricing, payment methods, and metadata
 * @tag Admin - Products
 * @auth bearerAuth
 * @body UpdateProductBody
 * @response 200:Product updated successfully
 * @responseSet auth
 * @add 404
 * @openapi
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.PRODUCT_EDIT)
    if (error) return error

    const { name, description, content, image, slug, price, currency, quantity, isActive, metadata } =
      (await req.json()) as UpdateProductBody

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return await ApiResponse.adminError('not_found', 404)
    }

    // Check if slug already exists (when updating to a different slug)
    if (slug !== undefined && slug !== existingProduct.slug) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { slug },
      })

      if (duplicateProduct) {
        return await ApiResponse.adminError('invalid_input', 400)
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        content: content !== undefined ? content : existingProduct.content,
        image: image !== undefined ? image : existingProduct.image,
        slug: slug || existingProduct.slug,
        price: price !== undefined ? Number(price) : existingProduct.price,
        currency: currency || existingProduct.currency,
        quantity: quantity !== undefined ? (quantity !== null ? Number(quantity) : null) : existingProduct.quantity,
        isActive: isActive !== undefined ? isActive : existingProduct.isActive,
        metadata: metadata !== undefined ? metadata : existingProduct.metadata,
      },
    })

    // Log audit
    await logAudit({
      adminUserId,
      action: 'update',
      resource: 'product',
      resourceId: product.id,
      details: { name: product.name },
    })

    return ApiResponse.success({ product })
  } catch (error) {
    console.error('Update product error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
