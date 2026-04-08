'use client'

import { useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, ChevronRight, ChevronDown, Layers, List, Grid3x3 } from 'lucide-react'
import { PaginationWrapper } from '@/components/ui/PaginationWrapper'
import { usePaginationWrapper } from '@/hooks/usePaginationWrapper'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

interface CategoryTree {
  id: string
  name: string
  slug: string
  parentId: string | null
  _count?: { posts: number }
  children: CategoryTree[]
}

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  featuredImage?: string
  publishedAt?: string
  categories?: Array<{ category: { id: string; name: string; slug: string } }>
}

interface CategoryNodeProps {
  node: CategoryTree
  selectedId: string | undefined
  onSelect: (id: string) => void
  depth?: number
}

function CategoryNode({ node, selectedId, onSelect, depth = 0 }: CategoryNodeProps) {
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedId === node.id
  const isAncestor =
    hasChildren &&
    node.children.some(
      c => c.id === selectedId || (c.children && c.children.some(g => g.id === selectedId))
    )
  const [open, setOpen] = useState(isSelected || isAncestor)
  const pl = depth === 0 ? 'pl-3' : depth === 1 ? 'pl-7' : 'pl-11'

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 pr-3 rounded-lg cursor-pointer group transition-all ${pl} ${
          isSelected ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'
        }`}
      >
        <button
          onClick={e => {
            e.stopPropagation()
            setOpen(o => !o)
          }}
          className={`shrink-0 transition-transform ${
            hasChildren ? 'opacity-60 group-hover:opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <span className="flex-1 text-sm truncate" onClick={() => onSelect(node.id)}>
          {node.name}
        </span>
        {node._count && node._count.posts > 0 && (
          <span className={`text-xs ml-auto shrink-0 ${isSelected ? 'opacity-80' : 'opacity-40'}`}>
            {node._count.posts}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map(child => (
            <CategoryNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CategorySidebarProps {
  tree: CategoryTree[]
  selectedId: string | undefined
  onSelect: (id: string | undefined) => void
}

function CategorySidebar({ tree, selectedId, onSelect }: CategorySidebarProps) {
  const t = useTranslations('blog')
  return (
    <nav className="space-y-0.5">
      <div
        onClick={() => onSelect(undefined)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-all ${
          !selectedId ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'
        }`}
      >
        <span className="flex-1">{t('all_categories')}</span>
      </div>
      {tree.map(root => (
        <CategoryNode
          key={root.id}
          node={root}
          selectedId={selectedId}
          onSelect={id => onSelect(id)}
          depth={0}
        />
      ))}
    </nav>
  )
}

function findCategoryName(tree: CategoryTree[], id: string): string | null {
  for (const node of tree) {
    if (node.id === id) return node.name
    if (node.children) {
      const found = findCategoryName(node.children, id)
      if (found) return found
    }
  }
  return null
}

export default function BlogPage() {
  const t = useTranslations('blog')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedCategory = searchParams.get('category') || undefined
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/posts/categories?locale=${locale}`)
      .then(r => r.json())
      .then(result => {
        if (result.success && result.data) setCategoryTree(result.data.categories)
      })
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [locale])

  const handleCategorySelect = useCallback(
    (id: string | undefined) => {
      setSidebarOpen(false)
      router.push(id ? `/blog?category=${id}` : '/blog')
    },
    [router]
  )

  const fetchPosts = useCallback(
    async (page: number, pageSize: number) => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), locale })
      if (selectedCategory) params.append('category', selectedCategory)
      const res = await fetch(`/api/posts/blog?${params}`)
      const result = await res.json()
      if (result.success && result.data)
        return { items: result.data.posts, totalCount: result.data.totalCount }
      return { items: [], totalCount: 0 }
    },
    [selectedCategory, locale]
  )

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
  } = usePaginationWrapper<Post>({ fetchFunction: fetchPosts, pageSize: 12, type: 'traditional' })

  const selectedCategoryName = selectedCategory
    ? findCategoryName(categoryTree, selectedCategory)
    : null

  const renderPosts = (items: unknown[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <FileText className="w-16 h-16 text-base-content/20" />
              )}
            </figure>
            <div className="card-body p-5">
              <div className="flex items-center gap-2 text-xs opacity-60 mb-1.5">
                {post.categories?.[0] && (
                  <span className="badge badge-primary badge-sm badge-outline">
                    {post.categories[0].category.name}
                  </span>
                )}
                <span className="ml-auto">
                  {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : ''}
                </span>
              </div>
              <h2 className="card-title text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-sm opacity-60 line-clamp-3">
                {post.excerpt ||
                  post.content
                    ?.replace(/<[^>]*>/g, '')
                    .replace(/&[a-z]+;/gi, ' ')
                    .trim()
                    .substring(0, 140)}
              </p>
              <div className="mt-3 pt-3 border-t border-base-200">
                <span className="text-primary text-xs font-semibold">{t('read_more')}</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="bg-base-200/30 grow">
      <div className="bg-base-100 border-b border-base-200 py-10">
        <div className="container mx-auto px-4 flex items-end justify-between">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{t('title')}</h1>
          <p className="text-base-content/50 text-base">{t('subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8 relative">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-6">
              <div className="bg-base-100 rounded-2xl border border-base-content/8 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-3 px-1">
                  {t('all_categories')}
                </p>
                <CategorySidebar
                  tree={categoryTree}
                  selectedId={selectedCategory}
                  onSelect={handleCategorySelect}
                />
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {/* Mobile category toggle */}
            <div className="lg:hidden mb-4 relative">
              <button
                className="btn btn-sm btn-outline gap-2"
                onClick={() => setSidebarOpen(o => !o)}
              >
                <ChevronRight
                  size={14}
                  className={`transition-transform ${sidebarOpen ? 'rotate-90' : ''}`}
                />
                {selectedCategoryName || t('all_categories')}
              </button>
              {sidebarOpen && (
                <div className="absolute z-30 mt-2 w-56 bg-base-100 rounded-2xl border border-base-content/10 shadow-lg p-3">
                  <CategorySidebar
                    tree={categoryTree}
                    selectedId={selectedCategory}
                    onSelect={handleCategorySelect}
                  />
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div>
                {selectedCategoryName ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-50">{t('category_label')}</span>
                    <span className="badge badge-primary">{selectedCategoryName}</span>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCategorySelect(undefined)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-sm opacity-50">
                    {t(totalCount !== 1 ? 'articles_count_plural' : 'articles_count', {
                      count: totalCount,
                    })}
                  </span>
                )}
              </div>
              <div className="join">
                <button
                  className={`btn btn-xs join-item gap-1.5 ${type === 'traditional' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setType('traditional')}
                >
                  <Grid3x3 className="w-3 h-3" /> {t('pages')}
                </button>
                <button
                  className={`btn btn-xs join-item gap-1.5 ${type === 'loadMore' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setType('loadMore')}
                >
                  <List className="w-3 h-3" /> {t('load_more')}
                </button>
                <button
                  className={`btn btn-xs join-item gap-1.5 ${type === 'infinite' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setType('infinite')}
                >
                  <Layers className="w-3 h-3" /> {t('infinite')}
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
              loadMoreText={t('load_more')}
              observerTarget={observerTarget}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
