'use client'

import { useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, Grid3x3, List, Layers } from 'lucide-react'
import { PaginationWrapper } from '@/components/ui/PaginationWrapper'
import { usePagination } from '@/hooks/usePagination'
import { useSearchParams } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  featuredImage?: string
  publishedAt?: string
  categories?: Array<{
    category: Category
  }>
}

export default function BlogPage() {
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category') || undefined
  const [categories, setCategories] = useState<Category[]>([])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/posts/categories')
        const result = await response.json()
        if (result.success && result.data) {
          setCategories(result.data.categories)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch function for pagination
  const fetchPosts = useCallback(
    async (page: number, pageSize: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      if (selectedCategory) {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/posts/blog?${params.toString()}`)
      const result = await response.json()

      if (result.success && result.data) {
        return {
          items: result.data.posts,
          totalCount: result.data.totalCount,
        }
      }

      return { items: [], totalCount: 0 }
    },
    [selectedCategory]
  )

  // Use pagination hook
  const {
    items: posts,
    currentPage,
    totalCount,
    pageSize,
    loading,
    hasMore,
    goToPage,
    loadMore,
    type,
    setType,
    observerTarget,
  } = usePagination<Post>({
    fetchFunction: fetchPosts,
    pageSize: 12,
    type: 'traditional',
  })

  const renderPosts = (items: unknown[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map(item => {
          const post = item as Post
          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
            >
              <figure className="aspect-video overflow-hidden relative bg-base-200 flex items-center justify-center">
                {post.featuredImage ? (
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <FileText className="w-20 h-20 text-base-content/20" />
                )}
              </figure>
              <div className="card-body p-6">
                <div className="flex items-center gap-2 text-xs opacity-60 mb-2">
                  {post.categories?.[0] && (
                    <span className="badge badge-primary badge-sm badge-outline">
                      {post.categories[0].category.name}
                    </span>
                  )}
                  <span>
                    {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : '-'}
                  </span>
                </div>
                <h2 className="card-title text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm opacity-70 line-clamp-3 mb-4">
                  {post.excerpt || post.content?.substring(0, 150) + '...'}
                </p>
                <div className="card-actions justify-between items-center mt-auto border-t border-base-200 pt-4">
                  <span className="text-primary text-sm font-semibold flex items-center gap-1">
                    Read More
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-base-200/30 grow py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-base-content/60 text-lg">Latest articles and updates</p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <div className="tabs tabs-boxed bg-base-100 p-1 shadow-sm overflow-x-auto flex-nowrap max-w-full">
            <Link
              href="/blog"
              className={`tab tab-sm md:tab-md transition-all ${!selectedCategory ? 'tab-active bg-primary! text-primary-content! font-bold' : ''}`}
            >
              All Categories
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.id}`}
                className={`tab tab-sm md:tab-md whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'tab-active bg-primary! text-primary-content! font-bold'
                    : ''
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Pagination Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="join">
            <button
              className={`btn btn-sm join-item gap-2 ${type === 'traditional' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setType('traditional')}
            >
              <Grid3x3 className="w-4 h-4" />
              Traditional
            </button>
            <button
              className={`btn btn-sm join-item gap-2 ${type === 'loadMore' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setType('loadMore')}
            >
              <List className="w-4 h-4" />
              Load More
            </button>
            <button
              className={`btn btn-sm join-item gap-2 ${type === 'infinite' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setType('infinite')}
            >
              <Layers className="w-4 h-4" />
              Infinite Scroll
            </button>
          </div>
        </div>

        <PaginationWrapper
          items={posts}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          type={type}
          onPageChange={goToPage}
          onLoadMore={loadMore}
          loading={loading}
          hasMore={hasMore}
          renderData={renderPosts}
          loadMoreText="Load More Posts"
          loadingText="Loading Posts..."
          noMoreText="No more posts to load"
          observerTarget={observerTarget}
        />
      </div>
    </div>
  )
}
