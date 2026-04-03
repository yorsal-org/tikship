import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { ApiResponse } from '@/lib/utils/api-response'
import { socialService } from '@/lib/social'
import type { ToggleLikeBody, TargetType } from '@/types/social'

/**
 * Toggle like status
 * @description Public endpoint to like or unlike a blog/page/product (requires login)
 * @tag Social - Likes
 * @auth sessionAuth
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized('Please login to like')
    }

    const body = (await req.json()) as ToggleLikeBody
    const { targetType, targetId } = body

    // Validate required fields
    if (!targetType || !targetId) {
      return ApiResponse.error('targetType and targetId are required', 400)
    }

    // Validate targetType
    if (!['blog', 'page', 'product'].includes(targetType)) {
      return ApiResponse.error('Invalid targetType', 400)
    }

    // Get settings to check if likes are enabled
    const settings = await socialService.getSettings()
    if (!settings.enableLikes) {
      return ApiResponse.error('Likes are disabled', 403)
    }

    const result = await socialService.toggleLike({
      userId: session.user.id,
      targetType,
      targetId,
    })

    return ApiResponse.success(result)
  } catch (error) {
    console.error('Toggle like error:', error)
    return ApiResponse.serverError()
  }
}

/**
 * Get like count and user status
 * @description Public endpoint to get like count and user's like status
 * @tag Social - Likes
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const targetType = searchParams.get('targetType') as TargetType
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return ApiResponse.error('targetType and targetId are required', 400)
    }

    // Validate targetType
    if (!['blog', 'page', 'product'].includes(targetType)) {
      return ApiResponse.error('Invalid targetType', 400)
    }

    // Get user session if available
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    const [likeInfo, settings] = await Promise.all([
      socialService.getLikeInfo({ targetType, targetId, userId }),
      socialService.getSettings(),
    ])

    return ApiResponse.success({
      ...likeInfo,
      enableLikes: settings.enableLikes,
    })
  } catch (error) {
    console.error('Get like info error:', error)
    return ApiResponse.serverError()
  }
}
