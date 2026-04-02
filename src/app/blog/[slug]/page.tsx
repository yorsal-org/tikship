import { PostType } from '@/types/post'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ChevronLeft, Calendar, User, Hash } from 'lucide-react'
import { getPostBySlug } from '@/lib/post/utils'
import Image from 'next/image'
import { PostContent } from '@/components/post/PostContent'

const BASE_URL = process.env.NEXTAUTH_URL || ''

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug, PostType.ARTICLE)
  if (!post) return {}

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt || ''
  const images = post.featuredImage ? [{ url: post.featuredImage, alt: title }] : []
  const t = await getTranslations('site')
  const siteName = t('name')

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/blog/${slug}`,
      images,
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      authors: post.author?.name ? [post.author.name] : undefined,
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug, PostType.ARTICLE)
  const t = await getTranslations('posts_public')
  const siteT = await getTranslations('site')
  const siteName = siteT('name')

  if (!post) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author.name || post.author.username,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="bg-base-100 grow pb-20">
      {/* Hero Section */}
      <div className="w-full bg-base-200/50 py-12 md:py-20 border-b border-base-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-8 hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={16} /> {t('back_to_blog')}
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm opacity-60">
            <div className="flex items-center gap-2">
              <User size={16} /> <span>{post.author?.name || post.author?.username}</span>
            </div>
            {post.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar size={16} />{' '}
                <span>{format(new Date(post.publishedAt), 'MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12 md:py-16">
        {post.featuredImage && (
          <div className="relative w-full aspect-video rounded-2xl mb-12 shadow-lg overflow-hidden bg-base-200 flex items-center justify-center">
            <Image src={post.featuredImage} alt={post.title} fill className="object-cover" />
          </div>
        )}

        {/* Content */}
        <PostContent content={post.content} />

        {/* Footer info: Categories & Tags */}
        <div className="mt-16 pt-8 border-t border-base-200 flex flex-col gap-6">
          {post.categories && post.categories.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold opacity-50">{t('category')}:</span>
              <div className="flex flex-wrap gap-2">
                {post.categories.map(c => (
                  <Link
                    key={c.category.id}
                    href={`/blog?category=${c.category.id}`}
                    className="badge badge-primary badge-outline"
                  >
                    {c.category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold opacity-50">{t('tags')}:</span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(t => (
                  <span
                    key={t.tag.id}
                    className="badge badge-ghost whitespace-nowrap flex items-center gap-1"
                  >
                    <Hash size={12} /> {t.tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
    </>
  )
}
