import { PostType } from '@/types/post'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPostBySlug } from '@/lib/post/utils'
import { getModuleState } from '@/lib/module-state'
import Image from 'next/image'
import { PostContent } from '@/components/post/PostContent'
import { CommentSection } from '@/components/social/CommentSection'
import { LikeButton } from '@/components/social/LikeButton'

const BASE_URL = process.env.NEXTAUTH_URL || ''

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug, PostType.PAGE)
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
      canonical: `/p/${slug}`,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/p/${slug}`,
      images,
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
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

export default async function SinglePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug, PostType.PAGE)
  const siteT = await getTranslations('site')
  const siteName = siteT('name')
  const { social: isSocialEnabled } = getModuleState()

  if (!post) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/p/${slug}`,
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{post.title}</h1>
            {post.publishedAt && (
              <div className="text-sm opacity-60">
                {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
              </div>
            )}
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

          {/* Footer info: Categories */}
          <div className="mt-16 pt-8 border-t border-base-200 flex flex-col gap-6">
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.categories.map(c => (
                  <span key={c.category.id} className="badge badge-primary badge-outline">
                    {c.category.name}
                  </span>
                ))}
              </div>
            )}

            {/* Like Button */}
            {isSocialEnabled && (
              <div className="flex items-center gap-4">
                <LikeButton targetType="page" targetId={post.id} />
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Comments Section */}
      {isSocialEnabled && (
        <div className="container mx-auto px-4 max-w-4xl pb-16">
          <CommentSection targetType="page" targetId={post.id} />
        </div>
      )}
    </>
  )
}
