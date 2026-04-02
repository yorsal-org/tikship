import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { siteConfig } from '@/config/site'

type MemberBulkAction = 'activate' | 'deactivate' | 'delete'


/**
 * Get members list
 * @description Retrieve paginated list of members with search and status filtering
 * @tag Admin - Members
 * @auth bearerAuth
 * @params MemberQueryParams
 * @response 200:Returns paginated list of members
 * @responseSet auth
 * @openapi
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.USER_VIEW)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'active' or 'inactive'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || siteConfig.admin.pageSize.toString())

    const where: { AND: Array<Record<string, unknown>> } = {
      AND: [],
    }

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (status) {
      where.AND.push({
        isActive: status === 'active',
      })
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          emailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return ApiResponse.success({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Get members error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Bulk update/delete members
 * @description Perform bulk actions (activate/deactivate/delete) on multiple members
 * @tag Admin - Members
 * @auth bearerAuth
 * @openapi
 */
export async function PUT(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.USER_EDIT)
    if (error) return error

    const body = await req.json() as { ids?: unknown; action?: unknown }
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0 || typeof action !== 'string') {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    const validActions: MemberBulkAction[] = ['activate', 'deactivate', 'delete']
    if (!validActions.includes(action as MemberBulkAction)) {
      return await ApiResponse.adminError('invalid_params', 400)
    }

    const bulkAction = action as MemberBulkAction

    if (bulkAction === 'delete') {
      const { error: deleteError } = await requireAdminAuth(req, PERMISSIONS.USER_DELETE)
      if (deleteError) return deleteError

      // Only allow deleting disabled members
      const membersToDelete = await prisma.user.findMany({
        where: { id: { in: ids as string[] } },
        select: { id: true, isActive: true },
      })

      const activeMembers = membersToDelete.filter(m => m.isActive)
      if (activeMembers.length > 0) {
        return await ApiResponse.adminError('cannot_delete_active_member', 400)
      }

      const { count } = await prisma.user.deleteMany({
        where: { id: { in: ids as string[] }, isActive: false },
      })
      return ApiResponse.success({ count })
    }

    const isActive = bulkAction === 'activate'
    const { count } = await prisma.user.updateMany({
      where: { id: { in: ids as string[] } },
      data: { isActive },
    })

    return ApiResponse.success({ count })
  } catch (error) {
    console.error('Bulk update members error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
