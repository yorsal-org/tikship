import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { socialService } from '@/lib/social'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import type { CommentStatus } from '@/types/social'

/**
 * Get single comment with replies
 * @description Admin endpoint to get comment details
 * @tag Admin - Social
 * @auth bearerAuth
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.COMMENT_MANAGE)
    if (error) return error

    const { id } = await params
    const comment = await socialService.getAdminComment(id)

    if (!comment) {
      return await ApiResponse.adminError('not_found', 404)
    }

    return ApiResponse.success({ comment })
  } catch (error) {
    console.error('Get comment error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Update comment status
 * @description Admin endpoint to approve/reject a comment
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

    const { id } = await params
    const body = await req.json() as { status: CommentStatus }
    const { status } = body

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return await ApiResponse.adminError('invalid_params', 400)
    }

    const comment = await socialService.updateCommentStatus(id, status)

    await logAudit({
      adminUserId,
      action: status === 'APPROVED' ? AUDIT_ACTIONS.COMMENT_APPROVE : AUDIT_ACTIONS.COMMENT_REJECT,
      resource: 'comment',
      resourceId: id,
      details: { status },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    })

    return ApiResponse.success({ comment })
  } catch (error) {
    console.error('Update comment error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Delete comment
 * @description Admin endpoint to delete a comment
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

    const { id } = await params

    await socialService.deleteComment(id)

    await logAudit({
      adminUserId,
      action: AUDIT_ACTIONS.COMMENT_DELETE,
      resource: 'comment',
      resourceId: id,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    })

    return ApiResponse.success({ deleted: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
