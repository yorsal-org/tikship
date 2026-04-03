import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { ApiResponse } from '@/lib/utils/api-response'
import { socialService } from '@/lib/social'
import type { CreateReplyBody } from '@/types/social'

/**
 * Create a reply to a comment
 * @description Public endpoint to create a reply (requires login)
 * @tag Social - Replies
 * @auth sessionAuth
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized('Please login to reply')
    }

    const body = (await req.json()) as CreateReplyBody & { commentId: string }
    const { content, commentId } = body

    // Validate required fields
    if (!content || !commentId) {
      return ApiResponse.error('content and commentId are required', 400)
    }

    // Check if comment exists
    const comment = await socialService.getAdminComment(commentId)
    if (!comment) {
      return ApiResponse.error('Comment not found', 404)
    }

    // Get settings to check if comments are enabled
    const settings = await socialService.getSettings()
    if (!settings.enableComments) {
      return ApiResponse.error('Comments are disabled', 403)
    }

    // Check content length
    if (content.length > settings.maxReplyLength) {
      return ApiResponse.error(`Reply content exceeds maximum length of ${settings.maxReplyLength}`, 400)
    }

    const ipAddress = req.headers.get('x-forwarded-for') || null
    const userAgent = req.headers.get('user-agent') || null

    const reply = await socialService.createReply({
      userId: session.user.id,
      commentId,
      content,
      ipAddress,
      userAgent,
    })

    return ApiResponse.success({ reply }, 201)
  } catch (error) {
    console.error('Create reply error:', error)
    return ApiResponse.serverError()
  }
}
