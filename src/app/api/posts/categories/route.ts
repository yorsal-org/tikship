import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'

/**
 * Get categories (hierarchical tree)
 * @description Retrieve all post categories as a hierarchical tree for public viewing
 * @tag Public - Posts
 * @response 200:Returns hierarchical category tree
 * @responseSet public
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const locale = searchParams.get('locale') || undefined
    const categories = await postService.listPublicCategoriesTree(locale)
    return ApiResponse.success({ categories })
  } catch (error) {
    console.error('List categories error:', error)
    return ApiResponse.error('Internal Server Error', 500)
  }
}
