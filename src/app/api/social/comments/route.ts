import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { ApiResponse } from '@/lib/utils/api-response'
import { socialService } from '@/lib/social'
import type { CreateCommentBody, TargetType } from '@/types/social'

/**
 * Get comments for a target
 * @description Public endpoint to get approved comments for a blog/page/product
 * @tag Social - Comments
 * @auth sessionAuth
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const targetType = searchParams.get('targetType') as TargetType
    const targetId = searchParams.get('targetId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    if (!targetType || !targetId) {
      return ApiResponse.error('targetType and targetId are required', 400)
    }

    // Validate targetType
    if (!['blog', 'page', 'product'].includes(targetType)) {
      return ApiResponse.error('Invalid targetType', 400)
    }

    const result = await socialService.getPublicComments({
      targetType,
      targetId,
      page,
      pageSize,
    })

    // Get settings for frontend
    const settings = await socialService.getSettings()

    return ApiResponse.success({
      ...result,
      settings: {
        enableComments: settings.enableComments,
        enableLikes: settings.enableLikes,
        commentRequireApproval: settings.commentRequireApproval,
        replyRequireApproval: settings.replyRequireApproval,
        maxCommentLength: settings.maxCommentLength,
        maxReplyLength: settings.maxReplyLength,
      },
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return ApiResponse.serverError()
  }
}

/**
 * Create a new comment
 * @description Public endpoint to create a comment (requires login)
 * @tag Social - Comments
 * @auth sessionAuth
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized('Please login to comment')
    }

    const body = (await req.json()) as CreateCommentBody
    const { content, targetType, targetId } = body

    // Validate required fields
    if (!content || !targetType || !targetId) {
      return ApiResponse.error('content, targetType and targetId are required', 400)
    }

    // Validate targetType
    if (!['blog', 'page', 'product'].includes(targetType)) {
      return ApiResponse.error('Invalid targetType', 400)
    }

    // Get settings to check if comments are enabled
    const settings = await socialService.getSettings()
    if (!settings.enableComments) {
      return ApiResponse.error('Comments are disabled', 403)
    }

    // Check content length
    if (content.length > settings.maxCommentLength) {
      return ApiResponse.error(`Comment content exceeds maximum length of ${settings.maxCommentLength}`, 400)
    }

    const ipAddress = req.headers.get('x-forwarded-for') || null
    const userAgent = req.headers.get('user-agent') || null

    const comment = await socialService.createComment({
      userId: session.user.id,
      targetType,
      targetId,
      content,
      ipAddress,
      userAgent,
    })

    return ApiResponse.success({ comment }, 201)
  } catch (error) {
    console.error('Create comment error:', error)
    return ApiResponse.serverError()
  }
}
