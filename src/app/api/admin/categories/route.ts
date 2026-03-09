import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { requireAdminAuth } from '@/lib/auth/admin'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit } from '@/lib/audit/service'
import type { CreateCategoryBody } from '@/types/api'

/**
 * Get categories
 * @description Retrieve all post categories
 * @tag Admin - Posts
 * @auth bearerAuth
 * @response 200:Returns list of categories
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAdminAuth(req, PERMISSIONS.ARTICLE_VIEW)
  if (error) return error

  try {
    const categories = await postService.listCategories()
    return ApiResponse.success({ categories })
  } catch {
    return ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Create category
 * @description Create a new post category
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
    const { name, description } = (await req.json()) as CreateCategoryBody
    if (!name) return ApiResponse.adminError('name_required', 400)

    const category = await postService.createCategory(name, description)

    await logAudit({
      adminUserId: adminUserId!,
      action: 'category:create',
      resource: 'category',
      resourceId: category.id,
      details: { name, description },
    })

    return ApiResponse.success({ category })
  } catch {
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
