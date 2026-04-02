import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { getAuditLogs, deleteOldAuditLogs } from '@/lib/audit/service'


/**
 * Get audit logs
 * @description Retrieve audit logs with filtering options for tracking admin actions
 * @tag Admin - Audit
 * @auth bearerAuth
 * @params AuditLogQueryParams
 * @response 200:Returns paginated list of audit logs
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.AUDIT_LOG_VIEW)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const filterAdminUserId = searchParams.get('adminUserId') || undefined
    const action = searchParams.get('action') || undefined
    const resource = searchParams.get('resource') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getAuditLogs({
      adminUserId: filterAdminUserId,
      action,
      resource,
      startDate,
      endDate,
      page,
      pageSize,
    })

    return ApiResponse.success(result)
  } catch (error) {
    console.error('Get audit logs error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}

/**
 * Delete audit logs older than a specified period
 * @description Bulk delete audit logs that are older than the given number of days
 * @tag Admin - Audit
 * @auth bearerAuth
 * @response 200:Returns count of deleted logs
 * @responseSet auth
 * @openapi
 */
export async function DELETE(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.AUDIT_LOG_DELETE)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '0')

    if (!days || days <= 0) {
      return await ApiResponse.adminError('invalid_params', 400)
    }

    const beforeDate = new Date()
    beforeDate.setDate(beforeDate.getDate() - days)

    const deletedCount = await deleteOldAuditLogs(beforeDate)

    return ApiResponse.success({ deletedCount })
  } catch (error) {
    console.error('Delete audit logs error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
