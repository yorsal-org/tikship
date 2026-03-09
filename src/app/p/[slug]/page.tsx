import { PostType } from '@/types/post'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/lib/auth/utils'
import Image from 'next/image'
import { PostContent } from '@/components/post/PostContent'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug, PostType.PAGE)
  if (!post) return {}
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  }
}

export default async function SinglePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug, PostType.PAGE)

  if (!post) {
    notFound()
  }

  return (
    <div className="bg-base-100 grow">
      <div className="w-full bg-base-200/50 py-16 md:py-24 border-b border-base-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">{post.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-12 md:py-20">
        {post.featuredImage && (
          <div className="relative w-full aspect-video rounded-2xl mb-12 shadow-md overflow-hidden">
            <Image src={post.featuredImage} alt={post.title} fill className="object-cover" />
          </div>
        )}

        <PostContent content={post.content} />
      </div>
    </div>
  )
}
