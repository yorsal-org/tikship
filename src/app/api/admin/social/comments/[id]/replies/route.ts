import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { socialService } from '@/lib/social'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import type { CommentStatus } from '@/types/social'

/**
 * Update reply status
 * @description Admin endpoint to approve/reject a reply
 * @tag Admin - Social
 * @auth bearerAuth
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.COMMENT_MANAGE)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { id: commentId } = await params
    const body = await req.json() as { replyId: string; status: CommentStatus }
    const { replyId, status } = body

    if (!replyId) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return await ApiResponse.adminError('invalid_params', 400)
    }

    const reply = await socialService.updateReplyStatus(replyId, status)

    await logAudit({
      adminUserId,
      action: status === 'APPROVED' ? AUDIT_ACTIONS.REPLY_APPROVE : AUDIT_ACTIONS.REPLY_REJECT,
      resource: 'reply',
      resourceId: replyId,
      details: { commentId, status },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    })

    return ApiResponse.success({ reply })
  } catch (error) {
    console.error('Update reply error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Delete reply
 * @description Admin endpoint to delete a reply
 * @tag Admin - Social
 * @auth bearerAuth
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.COMMENT_MANAGE)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const { id: commentId } = await params
    const body = await req.json() as { replyId: string }
    const { replyId } = body

    if (!replyId) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    await socialService.deleteReply(replyId)

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.REPLY_DELETE,
      resource: 'reply',
      resourceId: replyId,
      details: { commentId },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    })

    return ApiResponse.success({ deleted: true })
  } catch (error) {
    console.error('Delete reply error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
