import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'

/**
 * Get categories
 * @description Retrieve all post categories for public viewing
 * @tag Public - Posts
 * @response 200:Returns list of categories
 * @responseSet public
 * @openapi
 */
export async function GET() {
  try {
    const categories = await postService.listCategories()
    return ApiResponse.success({ categories })
  } catch (error) {
    console.error('List categories error:', error)
    return ApiResponse.error('Internal Server Error', 500)
  }
}
