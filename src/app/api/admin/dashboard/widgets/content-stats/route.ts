import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'

/**
 * Get content stats (only when content module enabled)
 * @description Posts, categories, tags
 * @tag Admin - Dashboard
 * @auth bearerAuth
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.ADMIN_USER_VIEW)
    if (error) return error

    const now = new Date()
    const last30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    last30Days.setDate(last30Days.getDate() - 30)

    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalCategories,
      totalTags,
      recentPosts,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: 'published' } }),
      prisma.post.count({ where: { status: 'draft' } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.post.findMany({
        where: { createdAt: { gte: last30Days } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Process post trend data - group by date
    const postTrendMap = new Map<string, number>()
    recentPosts.forEach(post => {
      const dateStr = post.createdAt.toISOString().split('T')[0]
      postTrendMap.set(dateStr, (postTrendMap.get(dateStr) || 0) + 1)
    })
    const postTrend = Array.from(postTrendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return ApiResponse.success({
      posts: {
        total: totalPosts,
        published: publishedPosts,
        draft: draftPosts,
      },
      categories: {
        total: totalCategories,
      },
      tags: {
        total: totalTags,
      },
      charts: {
        postTrend,
      },
    })
  } catch (error) {
    console.error('Get content stats error:', error)
    return await ApiResponse.adminError('operation_failed', 500)
  }
}
