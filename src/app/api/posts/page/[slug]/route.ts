import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PostType } from '@/types/post'

/**
 * Get a published page by slug
 * @description Retrieve a published page by its slug for public viewing
 * @tag Public - Posts
 * @response 200:Returns page details
 * @responseSet public
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const post = await postService.getPublicPost(slug, PostType.PAGE)

    if (!post) {
      return ApiResponse.error('Page not found', 404)
    }

    return ApiResponse.success({ post })
  } catch (error) {
    console.error('Get public page error:', error)
    return ApiResponse.error('Internal Server Error', 500)
  }
}
