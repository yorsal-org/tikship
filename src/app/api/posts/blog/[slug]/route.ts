import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PostType } from '@/types/post'

/**
 * Get a published article by slug
 * @description Retrieve a published blog article by its slug
 * @tag Public - Posts
 * @response 200:Returns article details
 * @responseSet public
 * @add 404
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const post = await postService.getPublicPost(slug, PostType.ARTICLE)

    if (!post) {
      return ApiResponse.error('Post not found', 404)
    }

    return ApiResponse.success({ post })
  } catch (error) {
    console.error('Get public article error:', error)
    return ApiResponse.error('Internal Server Error', 500)
  }
}
