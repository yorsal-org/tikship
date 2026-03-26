import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PostType } from '@/types/post'


/**
 * List published articles
 * @description Get paginated list of published blog articles for public viewing
 * @tag Public - Posts
 * @params PublicPostQueryParams
 * @response 200:Returns paginated list of published articles
 * @responseSet public
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId') || searchParams.get('category') || undefined
    const tagId = searchParams.get('tagId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '12')
    const locale = searchParams.get('locale') || undefined

    let categoryIds: string[] | undefined

    if (categoryId) {
      // Specific category selected: expand to all descendants
      categoryIds = await postService.getAllDescendantCategoryIds(categoryId)
    } else if (locale) {
      // No specific category: filter by all categories belonging to this locale
      const localeCategories = await postService.listCategories(locale)
      categoryIds = localeCategories.map(c => c.id)
      // If no categories exist for this locale, return empty (no cross-locale bleed)
      if (categoryIds.length === 0) {
        return ApiResponse.success({
          posts: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        })
      }
    }

    const result = await postService.listPublicPosts({
      type: PostType.ARTICLE,
      categoryIds,
      tagId,
      page,
      pageSize,
      orderBy: 'publishedAt',
      orderDir: 'desc',
    })

    return ApiResponse.success({
      posts: result.items,
      totalCount: result.total,
      totalPages: result.totalPages,
      currentPage: page,
    })
  } catch (error) {
    console.error('List public blog posts error:', error)
    return ApiResponse.error('Internal Server Error', 500)
  }
}
