import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PostStatus, PostType } from '@/types/post'


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

    const result = await postService.listPosts({
      type: PostType.ARTICLE,
      status: PostStatus.PUBLISHED,
      categoryId,
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
