import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { requireAdminAuth } from '@/lib/auth/admin'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'
import type { CreateCategoryBody } from '@/types/api'

/**
 * Get categories (hierarchical tree)
 * @description Retrieve all post categories as a tree (up to 3 levels)
 * @tag Admin - Posts
 * @auth bearerAuth
 * @response 200:Returns hierarchical category tree
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAdminAuth(req, PERMISSIONS.ARTICLE_VIEW)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const flat = searchParams.get('flat') === 'true'
    if (flat) {
      const categories = await postService.listCategories()
      return ApiResponse.success({ categories })
    }
    const categories = await postService.listCategoriesTree()
    return ApiResponse.success({ categories })
  } catch {
    return ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Create category
 * @description Create a new post category (max 3 levels deep)
 * @tag Admin - Posts
 * @auth bearerAuth
 * @body CreateCategoryBody
 * @response 200:Category created successfully
 * @responseSet auth
 * @openapi
 */
export async function POST(req: NextRequest) {
  const { adminUserId } = await requireAdminAuth(req, PERMISSIONS.ARTICLE_EDIT)
  if (!adminUserId) return ApiResponse.adminError('unauthorized', 401)

  try {
    const { name, description, parentId } = (await req.json()) as CreateCategoryBody
    if (!name) return ApiResponse.adminError('name_required', 400)

    const category = await postService.createCategory(name, description, parentId)

    await logAudit({
      adminUserId: adminUserId!,
      action: 'category:create',
      resource: 'category',
      resourceId: category.id,
      details: { name, description, parentId },
    })

    return ApiResponse.success({ category })
  } catch (err) {
    if (err instanceof Error && err.message === 'MAX_DEPTH_EXCEEDED') {
      return ApiResponse.adminError('category_max_depth_exceeded', 400)
    }
    return ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Delete category
 * @description Delete a post category by ID
 * @tag Admin - Posts
 * @auth bearerAuth
 * @params {id: string}
 * @response 200:Category deleted successfully
 * @responseSet auth
 * @openapi
 */
export async function DELETE(req: NextRequest) {
  const { adminUserId } = await requireAdminAuth(req, PERMISSIONS.ARTICLE_EDIT)
  if (!adminUserId) return ApiResponse.adminError('unauthorized', 401)

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return ApiResponse.adminError('required_fields_missing', 400)

    await postService.deleteCategory(id)

    await logAudit({
      adminUserId: adminUserId!,
      action: 'category:delete',
      resource: 'category',
      resourceId: id,
    })

    return ApiResponse.success({ success: true })
  } catch {
    return ApiResponse.adminError('server_error', 500)
  }
}
