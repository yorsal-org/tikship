import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { socialService } from '@/lib/social'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { parsePagination } from '@/lib/utils/pagination'
import type { CommentStatus, TargetType } from '@/types/social'

/**
 * Get all comments for admin
 * @description Admin endpoint to list all comments with filters
 * @tag Admin - Social
 * @auth bearerAuth
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.COMMENT_MANAGE)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as CommentStatus | null
    const targetType = searchParams.get('targetType') as TargetType | null
    const search = searchParams.get('search') || ''
    const { page, pageSize } = parsePagination(
      searchParams.get('page'),
      searchParams.get('pageSize')
    )

    const result = await socialService.getAdminComments({
      status: status || undefined,
      targetType: targetType || undefined,
      search: search || undefined,
      page,
      pageSize,
    })

    return ApiResponse.success(result)
  } catch (error) {
    console.error('Get admin comments error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Bulk update comment status
 * @description Admin endpoint to approve/reject multiple comments
 * @tag Admin - Social
 * @auth bearerAuth
 */
export async function PUT(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.COMMENT_MANAGE)
    if (error) return error

    const body = await req.json() as { ids?: string[]; action?: string }
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    let newStatus: CommentStatus
    let auditAction: string

    switch (action) {
      case 'approve':
        newStatus = 'APPROVED'
        auditAction = AUDIT_ACTIONS.COMMENT_APPROVE
        break
      case 'reject':
        newStatus = 'REJECTED'
        auditAction = AUDIT_ACTIONS.COMMENT_REJECT
        break
      default:
        return await ApiResponse.adminError('invalid_params', 400)
    }

    // Update all comments
    await Promise.all(
      ids.map(id =>
        socialService.updateCommentStatus(id, newStatus)
      )
    )

    // Log audit
    await Promise.all(
      ids.map(id =>
        logAudit({
          adminUserId: adminUserId as string,
          action: auditAction,
          resource: 'comment',
          resourceId: id,
          details: { action },
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        })
      )
    )

    return ApiResponse.success({ count: ids.length })
  } catch (error) {
    console.error('Bulk update comments error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Bulk delete comments
 * @description Admin endpoint to delete multiple comments
 * @tag Admin - Social
 * @auth bearerAuth
 */
export async function DELETE(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.COMMENT_MANAGE)
    if (error) return error

    const body = await req.json() as { ids?: string[] }
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    // Delete all comments
    await Promise.all(ids.map(id => socialService.deleteComment(id)))

    // Log audit
    await Promise.all(
      ids.map(id =>
        logAudit({
          adminUserId: adminUserId as string,
          action: AUDIT_ACTIONS.COMMENT_DELETE,
          resource: 'comment',
          resourceId: id,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        })
      )
    )

    return ApiResponse.success({ count: ids.length })
  } catch (error) {
    console.error('Delete comments error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
