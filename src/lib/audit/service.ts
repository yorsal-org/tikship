import { prisma } from '@/lib/db/prisma'
import { AuditLogParams } from '@/types/admin'
import { headers } from 'next/headers'

/**
 * Log audit event
 */
export async function logAudit({
  adminUserId,
  action,
  resource,
  resourceId,
  details,
  ipAddress,
  userAgent,
}: AuditLogParams): Promise<void> {
  // Auto-extract ipAddress and userAgent from request headers if not provided
  let finalIpAddress = ipAddress
  let finalUserAgent = userAgent

  if (!finalIpAddress || !finalUserAgent) {
    try {
      const headersList = await headers()
      if (!finalIpAddress) {
        finalIpAddress = headersList.get('x-forwarded-for') || 'unknown'
      }
      if (!finalUserAgent) {
        finalUserAgent = headersList.get('user-agent') || 'unknown'
      }
    } catch {
      // If headers() fails (e.g., not in request context), use defaults
      finalIpAddress = finalIpAddress || 'unknown'
      finalUserAgent = finalUserAgent || 'unknown'
    }
  }

  await prisma.adminAuditLog.create({
    data: {
      adminUserId,
      action,
      resource,
      resourceId,
      details: details ? JSON.stringify(details) : null,
      ipAddress: finalIpAddress,
      userAgent: finalUserAgent,
    },
  })
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs({
  adminUserId,
  action,
  resource,
  startDate,
  endDate,
  page = 1,
  pageSize = 20,
}: {
  adminUserId?: string
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}) {
  const where: {
    adminUserId?: string
    action?: { contains: string; mode: 'insensitive' }
    resource?: { contains: string; mode: 'insensitive' }
    createdAt?: { gte?: Date; lte?: Date }
  } = {}

  if (adminUserId) where.adminUserId = adminUserId
  if (action) {
    where.action = {
      contains: action,
      mode: 'insensitive',
    }
  }
  if (resource) {
    where.resource = {
      contains: resource,
      mode: 'insensitive',
    }
  }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      include: {
        adminUser: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminAuditLog.count({ where }),
  ])

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Delete audit logs older than a given date
 */
export async function deleteOldAuditLogs(beforeDate: Date): Promise<number> {
  const result = await prisma.adminAuditLog.deleteMany({
    where: {
      createdAt: {
        lt: beforeDate,
      },
    },
  })
  return result.count
}

// Audit action constants
export const AUDIT_ACTIONS = {
  // Admin User actions
  ADMIN_USER_CREATE: 'ADMIN_USER_CREATE',
  ADMIN_USER_UPDATE: 'ADMIN_USER_UPDATE',
  ADMIN_USER_DELETE: 'ADMIN_USER_DELETE',
  ADMIN_USER_ASSIGN_ROLE: 'ADMIN_USER_ASSIGN_ROLE',
  ADMIN_USER_REMOVE_ROLE: 'ADMIN_USER_REMOVE_ROLE',
  ADMIN_USER_ACTIVATE: 'ADMIN_USER_ACTIVATE',
  ADMIN_USER_DEACTIVATE: 'ADMIN_USER_DEACTIVATE',

  // Role actions
  ROLE_CREATE: 'ROLE_CREATE',
  ROLE_UPDATE: 'ROLE_UPDATE',
  ROLE_DELETE: 'ROLE_DELETE',
  ROLE_ASSIGN_PERMISSION: 'ROLE_ASSIGN_PERMISSION',
  ROLE_REMOVE_PERMISSION: 'ROLE_REMOVE_PERMISSION',

  // Post actions (articles and pages)
  ARTICLE_CREATE: 'ARTICLE_CREATE',
  ARTICLE_UPDATE: 'ARTICLE_UPDATE',
  ARTICLE_DELETE: 'ARTICLE_DELETE',
  PAGE_CREATE: 'PAGE_CREATE',
  PAGE_UPDATE: 'PAGE_UPDATE',
  PAGE_DELETE: 'PAGE_DELETE',

  // User actions (frontend users)
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',

  // Login actions
  ADMIN_LOGIN_SUCCESS: 'ADMIN_LOGIN_SUCCESS',
  ADMIN_LOGIN_FAILED: 'ADMIN_LOGIN_FAILED',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',

  // Social Module actions (Comments, Replies, Likes)
  COMMENT_CREATE: 'COMMENT_CREATE',
  COMMENT_UPDATE: 'COMMENT_UPDATE',
  COMMENT_DELETE: 'COMMENT_DELETE',
  COMMENT_APPROVE: 'COMMENT_APPROVE',
  COMMENT_REJECT: 'COMMENT_REJECT',
  REPLY_CREATE: 'REPLY_CREATE',
  REPLY_UPDATE: 'REPLY_UPDATE',
  REPLY_DELETE: 'REPLY_DELETE',
  REPLY_APPROVE: 'REPLY_APPROVE',
  REPLY_REJECT: 'REPLY_REJECT',
  LIKE_CREATE: 'LIKE_CREATE',
  LIKE_DELETE: 'LIKE_DELETE',
  SENSITIVE_WORD_CREATE: 'SENSITIVE_WORD_CREATE',
  SENSITIVE_WORD_DELETE: 'SENSITIVE_WORD_DELETE',
  SOCIAL_SETTINGS_UPDATE: 'SOCIAL_SETTINGS_UPDATE',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]
