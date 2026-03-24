'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Post, PostStatus, PostType, Category, PostBulkAction, PostsListResponse } from '@/types/post'
import { CategoriesListResponse } from '@/types/admin'
import { ApiResponse, BulkUpdatePostsBody } from '@/types/api'
import { Plus, Search, ExternalLink, Edit, Trash2, RotateCcw, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { ImportPostsModal } from '@/components/admin/post/ImportPostsModal'
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<Post | null>(null)
  const [isPermanentDelete, setIsPermanentDelete] = useState(false)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [pendingBulkAction, setPendingBulkAction] = useState<PostBulkAction | null>(null)

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // API Hooks
  const { request: fetchPosts, loading: loadingPosts } = useApi<PostsListResponse>(
    '/api/admin/posts',
    'GET'
  )
  const { request: fetchCategories } = useApi<CategoriesListResponse>(
    '/api/admin/categories?flat=true',
    'GET'
  )
  const { request: deletePost, loading: loadingDelete } = useApi('/api/admin/posts', 'DELETE')
  const { request: updatePost, loading: loadingUpdate } = useApi('/api/admin/posts', 'PUT')
  const { request: bulkUpdatePosts, loading: loadingBulkUpdate } = useApi<
    { count: number },
    BulkUpdatePostsBody
  >('/api/admin/posts', 'PUT')

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
        const nextPosts = (postsRes.data.items || []) as Post[]
        setPosts(nextPosts)
        setSelectedIds(current => current.filter(id => nextPosts.some(post => post.id === id)))
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

  const selectedPosts = useMemo(
    () => posts.filter(post => selectedIds.includes(post.id)),
    [posts, selectedIds]
  )
  const selectedCount = selectedIds.length
  const allSelected = posts.length > 0 && selectedIds.length === posts.length
  const allTrashSelection =
    selectedPosts.length > 0 && selectedPosts.every(post => post.status === PostStatus.TRASH)
  const allPublishableSelection =
    selectedPosts.length > 0 &&
    selectedPosts.every(
      post => post.status === PostStatus.DRAFT || post.status === PostStatus.SCHEDULED
    )
  const hasNonTrashSelection = selectedPosts.some(post => post.status !== PostStatus.TRASH)

  const handleToggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : posts.map(post => post.id))
  }

  const handleToggleSelect = (postId: string) => {
    setSelectedIds(current =>
      current.includes(postId) ? current.filter(id => id !== postId) : [...current, postId]
    )
  }

  const resetBulkState = () => {
    setPendingBulkAction(null)
    setIsBulkDeleteModalOpen(false)
  }

  const refreshList = async () => {
    setSelectedIds([])
    router.refresh()
    await fetchData(currentPage)
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
        await refreshList()
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
        await refreshList()
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
      await refreshList()
    }
  }

  const handleBulkAction = async (action: PostBulkAction) => {
    if (selectedIds.length === 0) return

    const { success, data } = await bulkUpdatePosts({
      ids: selectedIds,
      action,
      type,
    })

    if (success) {
      toast.success(
        t(action === 'delete' ? 'bulk_delete_success' : 'bulk_status_updated', {
          count: data?.count ?? selectedIds.length,
        })
      )
      resetBulkState()
      await refreshList()
    }
  }

  const requestBulkAction = (action: PostBulkAction) => {
    if (action === 'delete' || action === 'trash') {
      setPendingBulkAction(action)
      setIsBulkDeleteModalOpen(true)
      return
    }

    void handleBulkAction(action)
  }

  const bulkActionOptions = useMemo(() => {
    const options: { value: PostBulkAction; label: string }[] = []

    if (allPublishableSelection) {
      options.push({ value: 'publish', label: t('bulk_publish') })
    }

    if (hasNonTrashSelection) {
      options.push({ value: 'trash', label: t('bulk_trash') })
    }

    if (allTrashSelection) {
      options.push({ value: 'restore', label: t('bulk_restore') })
      options.push({ value: 'delete', label: t('bulk_delete') })
    }

    return options
  }, [allPublishableSelection, hasNonTrashSelection, allTrashSelection, t])

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
      key: 'select',
      label: (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={allSelected}
          onChange={handleToggleSelectAll}
          aria-label={t('select_all')}
        />
      ),
      className: 'w-12',
      render: post => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={selectedIds.includes(post.id)}
          onChange={() => handleToggleSelect(post.id)}
          aria-label={t('select_item', { title: post.title })}
        />
      ),
    },
    {
      key: 'title',
      label: t('table_title'),
      className: 'w-1/3',
      render: post => (
        <div>
          <div className="font-bold text-sm">{post.title}</div>
          <div className="text-[10px] opacity-40 truncate max-w-xs">/{post.slug}</div>
        </div>
      ),
    },
    {
      key: 'author',
      label: t('table_author'),
      render: post => <span className="text-xs">{post.author?.name || post.author?.username}</span>,
    },
    ...(type === PostType.ARTICLE
      ? [
          {
            key: 'categories',
            label: t('table_category'),
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
      label: t('table_status'),
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
      label: t('table_date'),
      render: post => {
        const effectiveStatus = getEffectivePostStatus(post)
        const date =
          effectiveStatus === PostStatus.PUBLISHED && post.publishedAt
            ? post.publishedAt
            : post.updatedAt
        return <span className="w-20 block text-xs opacity-60">{formatters.dateShort(date)}</span>
      },
    },
    {
      key: 'actions',
      label: t('table_actions'),
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
                onClick={() => router.push(`${siteConfig.admin.path}/${type.toLowerCase()}s/edit/${post.id}`)}
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
            title={t('view')}
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
        <div className="flex items-center gap-2">
          {type === PostType.ARTICLE && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn btn-ghost btn-sm gap-2"
            >
              <Upload size={16} /> {t('import')}
            </button>
          )}
          <button
            onClick={() => router.push(`${siteConfig.admin.path}/${type.toLowerCase()}s/new`)}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus size={18} /> {t('new')}
          </button>
        </div>
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
          <option value="">{t('all_status')}</option>
          <option value={PostStatus.PUBLISHED}>{t('status_published')}</option>
          <option value={PostStatus.DRAFT}>{t('status_draft')}</option>
          <option value={PostStatus.SCHEDULED}>{t('status_scheduled')}</option>
          <option value={PostStatus.TRASH}>{t('status_trash')}</option>
        </select>

        {type === PostType.ARTICLE && (
          <select
            className="select select-bordered select-sm h-10 min-h-0"
            value={categoryParam || ''}
            onChange={e => handleFilterChange('categoryId', e.target.value)}
          >
            <option value="">{t('all_categories')}</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="alert bg-base-200 border border-base-300 flex flex-wrap items-center gap-3">
          <span className="font-medium">{t('selected_count', { count: selectedCount })}</span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {bulkActionOptions.map(option => (
              <button
                key={option.value}
                className="btn btn-sm"
                onClick={() => requestBulkAction(option.value)}
                disabled={loadingBulkUpdate}
              >
                {option.label}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])}>
              {t('clear_selection')}
            </button>
          </div>
        </div>
      )}

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
        loading={loadingDelete || loadingUpdate}
        title={isPermanentDelete ? t('delete') : t('trash')}
        message={
          isPermanentDelete
            ? t('delete_confirm', { name: postToDelete?.title || '' })
            : t('trash_confirm', { name: postToDelete?.title || '' })
        }
        warning={isPermanentDelete ? t('delete_warning') : undefined}
        confirmText={isPermanentDelete ? t('delete') : t('trash')}
      />

      <DeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={resetBulkState}
        onConfirm={() => {
          if (pendingBulkAction) {
            void handleBulkAction(pendingBulkAction)
          }
        }}
        loading={loadingBulkUpdate}
        title={pendingBulkAction === 'delete' ? t('bulk_delete') : t('bulk_trash')}
        message={
          pendingBulkAction === 'delete'
            ? t('bulk_delete_confirm', { count: selectedCount })
            : t('bulk_trash_confirm', { count: selectedCount })
        }
        warning={pendingBulkAction === 'delete' ? t('delete_warning') : undefined}
        confirmText={pendingBulkAction === 'delete' ? t('bulk_delete') : t('bulk_trash')}
      />

      <ImportPostsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          void fetchData(currentPage)
        }}
      />
    </>
  )
}
