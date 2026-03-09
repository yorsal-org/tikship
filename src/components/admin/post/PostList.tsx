'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Post, PostStatus, PostType, Category } from '@/types/post'
import { PostsListResponse } from '@/types/order'
import { CategoriesListResponse } from '@/types/admin'
import { ApiResponse } from '@/types/api'
import { Plus, Search, ExternalLink, Edit, Trash2, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { Table, Column } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from '@/lib/utils/toast'
import { getEffectivePostStatus } from '@/lib/utils/post'
import { formatters } from '@/lib/utils/formatters'
import { useApi } from '@/hooks/useApi'
import { useAdminPagination as usePagination } from '@/hooks/useAdminPagination'
import { siteConfig } from '@/config/site'

interface PostListProps {
  type: PostType
}

export function PostList({ type }: PostListProps) {
  const router = useRouter()
  const t = useTranslations('admin.posts')

  const {
    page: currentPage,
    search: searchParam,
    searchInput,
    setSearchInput,
    handlePageChange,
    handleFilterChange: syncFilters,
    getParam,
    pageSize,
  } = usePagination({ pageSize: siteConfig.admin.pageSize })

  const statusParam = getParam('status')
  const categoryParam = getParam('categoryId')

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: siteConfig.admin.pageSize as number,
    total: 0,
    totalPages: 0,
  })

  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<Post | null>(null)
  const [isPermanentDelete, setIsPermanentDelete] = useState(false)

  // API Hooks
  const { request: fetchPosts, loading: loadingPosts } = useApi<PostsListResponse>(
    '/api/admin/posts',
    'GET'
  )
  const { request: fetchCategories } = useApi<CategoriesListResponse>(
    '/api/admin/categories',
    'GET'
  )
  const { request: deletePost, loading: loadingDelete } = useApi('/api/admin/posts', 'DELETE')
  const { request: updatePost, loading: loadingUpdate } = useApi('/api/admin/posts', 'PUT')

  const fetchData = useCallback(
    async (pageValue: number) => {
      const postsRes = await fetchPosts(undefined, {
        params: {
          type,
          status: statusParam || undefined,
          categoryId: type === PostType.ARTICLE ? categoryParam || undefined : undefined,
          search: searchParam || undefined,
          page: pageValue,
          pageSize,
        },
        onError: (err: string) => toast.error(err),
      })

      if (postsRes.success && postsRes.data) {
        setPosts((postsRes.data.items || []) as Post[])
        setPagination({
          page: postsRes.data.page,
          pageSize: postsRes.data.pageSize,
          total: postsRes.data.total,
          totalPages: postsRes.data.totalPages,
        })
      }
    },
    [fetchPosts, type, statusParam, categoryParam, searchParam, pageSize]
  )

  useEffect(() => {
    const loadData = async () => {
      await fetchData(currentPage)
    }
    void loadData()
  }, [currentPage, fetchData])

  useEffect(() => {
    if (type === PostType.ARTICLE) {
      fetchCategories(undefined, {
        onSuccess: (res: ApiResponse<CategoriesListResponse>) => {
          if (res.data?.categories) {
            setAllCategories(res.data.categories)
          }
        },
      })
    }
  }, [fetchCategories, type])

  const handleFilterChange = (key: string, value: string) => {
    syncFilters({ [key]: value })
  }

  const handleDelete = (post: Post, permanent: boolean = false) => {
    setPostToDelete(post)
    setIsPermanentDelete(permanent)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!postToDelete) return

    if (isPermanentDelete) {
      const { success } = await deletePost(undefined, {
        urlOverride: `/api/admin/posts/${postToDelete.id}?permanent=true`,
      })
      if (success) {
        toast.success(t('delete_success'))
        setIsDeleteModalOpen(false)
        setPostToDelete(null)
        router.refresh()
        await fetchData(currentPage)
      }
    } else {
      const { success } = await updatePost(
        { status: PostStatus.TRASH },
        {
          urlOverride: `/api/admin/posts/${postToDelete.id}`,
        }
      )
      if (success) {
        toast.success(t('status_updated'))
        setIsDeleteModalOpen(false)
        setPostToDelete(null)
        router.refresh()
        await fetchData(currentPage)
      }
    }
  }

  const handleRestore = async (post: Post) => {
    const { success } = await updatePost(
      { status: PostStatus.DRAFT },
      {
        urlOverride: `/api/admin/posts/${post.id}`,
      }
    )
    if (success) {
      toast.success(t('status_updated'))
      router.refresh()
      await fetchData(currentPage)
    }
  }

  const getStatusVariant = (
    status: PostStatus
  ): 'success' | 'error' | 'warning' | 'info' | 'ghost' => {
    const statusMap: Record<PostStatus, 'success' | 'error' | 'warning' | 'info' | 'ghost'> = {
      [PostStatus.PUBLISHED]: 'success',
      [PostStatus.DRAFT]: 'ghost',
      [PostStatus.SCHEDULED]: 'info',
      [PostStatus.TRASH]: 'error',
    }
    return statusMap[status] || 'ghost'
  }

  const columns: Column<Post>[] = [
    {
      key: 'title',
      label: 'Title',
      className: 'w-1/3',
      render: post => (
        <div>
          <div className="font-bold text-sm">{post.title}</div>
          <div className="text-[10px] opacity-40 font-mono truncate max-w-xs">/{post.slug}</div>
        </div>
      ),
    },
    {
      key: 'author',
      label: 'Author',
      render: post => <span className="text-xs">{post.author?.name || post.author?.username}</span>,
    },
    ...(type === PostType.ARTICLE
      ? [
          {
            key: 'categories',
            label: 'Category',
            render: (post: Post) => (
              <div className="flex flex-wrap gap-1">
                {post.categories?.map(c => (
                  <span
                    key={c.category.id}
                    className="badge badge-ghost badge-sm whitespace-nowrap"
                  >
                    {c.category.name}
                  </span>
                )) || <span className="opacity-30">-</span>}
              </div>
            ),
          } as Column<Post>,
        ]
      : []),
    {
      key: 'status',
      label: 'Status',
      render: post => {
        const effectiveStatus = getEffectivePostStatus(post)
        return (
          <StatusBadge
            status={effectiveStatus}
            variant={getStatusVariant(effectiveStatus)}
            size="sm"
            className="font-medium"
          />
        )
      },
    },
    {
      key: 'date',
      label: 'Date',
      render: post => {
        const effectiveStatus = getEffectivePostStatus(post)
        const date =
          effectiveStatus === PostStatus.PUBLISHED && post.publishedAt
            ? post.publishedAt
            : post.updatedAt
        return <span className="text-xs opacity-60 font-mono">{formatters.dateShort(date)}</span>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: post => (
        <div className="flex justify-end gap-1">
          {post.status === PostStatus.TRASH ? (
            <>
              <button
                className="btn btn-ghost btn-sm btn-square text-success"
                onClick={() => handleRestore(post)}
                disabled={loadingUpdate}
                title={t('restore')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                className="btn btn-ghost btn-sm btn-square text-error"
                onClick={() => handleDelete(post, true)}
                title={t('delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => router.push(`/admin/${type.toLowerCase()}s/edit/${post.id}`)}
                title={t('edit')}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                className="btn btn-ghost btn-sm btn-square text-error"
                onClick={() => handleDelete(post, false)}
                title={t('trash')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <a
            href={`/${type === PostType.ARTICLE ? 'blog' : 'p'}/${post.slug}`}
            target="_blank"
            className="btn btn-ghost btn-sm btn-square"
            title="View"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {type === PostType.ARTICLE ? t('articles') : t('pages')}
        </h1>
        <button
          onClick={() => router.push(`/admin/${type.toLowerCase()}s/new`)}
          className="btn btn-primary btn-sm gap-2"
        >
          <Plus size={18} /> {t('new')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-80">
          <Search size={18} className="absolute z-1 left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            className="input input-bordered w-full pl-10 h-10"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>

        <select
          className="select select-bordered select-sm h-10 min-h-0"
          value={statusParam || ''}
          onChange={e => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value={PostStatus.PUBLISHED}>Published</option>
          <option value={PostStatus.DRAFT}>Draft</option>
          <option value={PostStatus.SCHEDULED}>Scheduled</option>
          <option value={PostStatus.TRASH}>Trash</option>
        </select>

        {type === PostType.ARTICLE && (
          <select
            className="select select-bordered select-sm h-10 min-h-0"
            value={categoryParam || ''}
            onChange={e => handleFilterChange('categoryId', e.target.value)}
          >
            <option value="">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content Table */}
      <Table
        columns={columns}
        data={posts}
        loading={loadingPosts}
        emptyMessage={t('no_posts')}
        pagination={pagination}
        onPageChange={handlePageChange}
        getRowKey={post => post.id}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={loadingDelete}
        title={isPermanentDelete ? t('delete') : t('trash')}
        message={
          isPermanentDelete
            ? t('delete_confirm', { name: postToDelete?.title || '' })
            : `Move "${postToDelete?.title}" to trash?`
        }
        warning={isPermanentDelete ? t('delete_warning') : undefined}
        confirmText={isPermanentDelete ? t('delete') : t('trash')}
      />
    </>
  )
}
