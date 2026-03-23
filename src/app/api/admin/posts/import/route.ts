import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { postService } from '@/lib/post/service'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { PostStatus, PostType } from '@/types/post'
import { prisma } from '@/lib/db/prisma'
import { siteConfig } from '@/config/site'

interface ImportPostItem {
  title: string
  content_html: string
  categories?: string[]
  tags?: string[]
}

/**
 * Bulk import posts
 * @description Import multiple articles at once from JSON array. Slug is auto-generated from title. Status defaults to DRAFT. Categories are matched by name.
 * @tag Admin - Posts
 * @auth bearerAuth
 * @body ImportPostItem[]
 * @response 201:Import result with success/fail counts
 * @responseSet auth
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.ARTICLE_CREATE)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const body = await req.json()

    if (!Array.isArray(body) || body.length === 0) {
      return await ApiResponse.adminError('required_fields_missing', 400)
    }

    const importLimit = siteConfig.admin.articlesImportLimits
    if (body.length > importLimit) {
      return await ApiResponse.adminError('import_limit_exceeded', 400)
    }

    const allCategories = await prisma.category.findMany({
      select: { id: true, name: true },
    })
    const categoryNameMap = new Map(allCategories.map(category => [category.name.toLowerCase(), category.id]))

    const results: { title: string; success: boolean; error?: string }[] = []

    for (const item of body as ImportPostItem[]) {
      if (!item.title || typeof item.title !== 'string') {
        results.push({
          title: String(item.title ?? ''),
          success: false,
          error: 'missing_title',
        })
        continue
      }

      try {
        const categoryIds: string[] = []
        if (Array.isArray(item.categories)) {
          for (const name of item.categories) {
            const id = categoryNameMap.get(name.toLowerCase())
            if (id) categoryIds.push(id)
          }
        }

        const post = await postService.createPost(adminUserId, {
          title: item.title,
          content: item.content_html ?? '',
          status: PostStatus.DRAFT,
          type: PostType.ARTICLE,
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
          tagNames: Array.isArray(item.tags) ? item.tags : undefined,
        })

        await logAudit({
          adminUserId,
          action: AUDIT_ACTIONS.ARTICLE_CREATE,
          resource: 'article',
          resourceId: post.id,
          details: { title: post.title, slug: post.slug, imported: true },
        })

        results.push({ title: item.title, success: true })
      } catch (error) {
        console.error('Import post item error:', error)
        results.push({
          title: item.title,
          success: false,
          error: error instanceof Error ? error.message : 'unknown_error',
        })
      }
    }

    const successCount = results.filter(result => result.success).length
    const failCount = results.filter(result => !result.success).length

    return ApiResponse.success({ results, successCount, failCount }, 201)
  } catch (error) {
    console.error('Import posts error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
