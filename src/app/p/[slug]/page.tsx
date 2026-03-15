import { PostType } from '@/types/post'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/lib/auth/utils'
import Image from 'next/image'
import { PostContent } from '@/components/post/PostContent'
import { siteConfig } from '@/config/site'

const BASE_URL = process.env.NEXTAUTH_URL || ''

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug, PostType.PAGE)
  if (!post) return {}

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt || ''
  const images = post.featuredImage ? [{ url: post.featuredImage, alt: title }] : []

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
      siteName: siteConfig.name,
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
      name: siteConfig.name,
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
        </div>
      </article>
    </>
  )
}
