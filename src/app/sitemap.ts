import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getModuleState } from '@/lib/module-state'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXTAUTH_URL || ''

// Define Post type for dynamic access
interface PostQueryResult {
  slug: string
  updatedAt: Date
}

interface PostQueryArgs {
  where: {
    type: string
    status: string
    publishedAt?: { lte: Date }
  }
  select: { slug: true; updatedAt: true }
  orderBy?: { publishedAt?: 'desc' }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const moduleState = getModuleState()

  // Static routes - always include home
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ]

  // Blog listing page - only if content module is enabled
  if (moduleState.content) {
    staticRoutes.push({
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    })
  }

  // Products listing page - only if commerce module is enabled
  if (moduleState.commerce) {
    staticRoutes.push({
      url: `${BASE_URL}/products`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // Dynamic blog posts (content module)
  let blogRoutes: MetadataRoute.Sitemap = []
  if (moduleState.content) {
    try {
      // Use dynamic property access to avoid TypeScript errors when Post model doesn't exist
      const postModel = (prisma as unknown as Record<string, unknown>).post as {
        findMany: (args: PostQueryArgs) => Promise<PostQueryResult[]>
      } | undefined

      if (postModel) {
        const posts = await postModel.findMany({
          where: {
            type: 'ARTICLE',
            status: 'PUBLISHED',
            publishedAt: { lte: now },
          },
          select: { slug: true, updatedAt: true },
          orderBy: { publishedAt: 'desc' },
        })
        blogRoutes = posts.map(post => ({
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
      }
    } catch {
      // DB not available at build time — skip dynamic routes
    }
  }

  // Dynamic product pages (commerce module)
  let productRoutes: MetadataRoute.Sitemap = []
  if (moduleState.commerce) {
    try {
      // Use dynamic property access to avoid TypeScript errors when Product model doesn't exist
      const productModel = (prisma as unknown as Record<string, unknown>).product as {
        findMany: (args: {
          where: { isActive: boolean }
          select: { slug: true; updatedAt: true }
          orderBy: { createdAt: 'desc' }
        }) => Promise<{ slug: string; updatedAt: Date }[]>
      } | undefined

      if (productModel) {
        const products = await productModel.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
          orderBy: { createdAt: 'desc' },
        })
        productRoutes = products.map(product => ({
          url: `${BASE_URL}/products/${product.slug}`,
          lastModified: product.updatedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      }
    } catch {
      // DB not available at build time — skip dynamic routes
    }
  }

  // Dynamic CMS pages (content module)
  let pageRoutes: MetadataRoute.Sitemap = []
  if (moduleState.content) {
    try {
      // Use dynamic property access to avoid TypeScript errors when Post model doesn't exist
      const postModel = (prisma as unknown as Record<string, unknown>).post as {
        findMany: (args: PostQueryArgs) => Promise<PostQueryResult[]>
      } | undefined

      if (postModel) {
        const pages = await postModel.findMany({
          where: {
            type: 'PAGE',
            status: 'PUBLISHED',
            publishedAt: { lte: now },
          },
          select: { slug: true, updatedAt: true },
        })
        pageRoutes = pages.map(page => ({
          url: `${BASE_URL}/p/${page.slug}`,
          lastModified: page.updatedAt,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      }
    } catch {
      // DB not available at build time — skip dynamic routes
    }
  }

  return [...staticRoutes, ...blogRoutes, ...productRoutes, ...pageRoutes]
}
