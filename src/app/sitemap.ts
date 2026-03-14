import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'
import { PostStatus, PostType } from '@/types/post'

const BASE_URL = process.env.NEXTAUTH_URL || ''

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/license`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Dynamic blog posts
  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.post.findMany({
      where: {
        type: PostType.ARTICLE,
        status: PostStatus.PUBLISHED,
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
  } catch {
    // DB not available at build time — skip dynamic routes
  }

  // Dynamic product pages
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const products = await prisma.product.findMany({
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
  } catch {
    // DB not available at build time — skip dynamic routes
  }

  // Dynamic CMS pages (/p/[slug])
  let pageRoutes: MetadataRoute.Sitemap = []
  try {
    const pages = await prisma.post.findMany({
      where: {
        type: PostType.PAGE,
        status: PostStatus.PUBLISHED,
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
  } catch {
    // DB not available at build time — skip dynamic routes
  }

  return [...staticRoutes, ...blogRoutes, ...productRoutes, ...pageRoutes]
}
