'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/utils/toast'
import { Table, Column } from '@/components/ui/Table'
import { CommentStats } from '@/components/admin/social/CommentStats'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RepliesModal } from '@/components/admin/social/RepliesModal'
import { useApi } from '@/hooks/useApi'
import { useAdminPagination } from '@/hooks/useAdminPagination'
import type { Comment, CommentStatus, TargetType, CommentWithReplies } from '@/types/social'
import { MessageCircle } from 'lucide-react'

type CommentBulkAction = 'approve' | 'reject' | 'delete'

export default function CommentsPage() {
  const t = useTranslations('admin.social.comments')

  const {
    page: currentPage,
    search: searchParam,
    searchInput,
    setSearchInput,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange: syncFilters,
    getParam,
    pageSize,
  } = useAdminPagination()

  const statusParam = getParam('status') as CommentStatus | undefined
  const targetTypeParam = getParam('targetType') as TargetType | undefined

  const [comments, setComments] = useState<Array<Comment & { repliesCount: number }>>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingBulkAction, setPendingBulkAction] = useState<CommentBulkAction | null>(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [pagination, setPagination] = useState({})

  // Replies modal state
  const [isRepliesModalOpen, setIsRepliesModalOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState<CommentWithReplies | null>(null)

  // API hooks
  const commentsApi = useApi<{
    comments: Array<Comment & { repliesCount: number }>
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>('/api/admin/social/comments', 'GET')

  const commentDetailApi = useApi<{
    comment: CommentWithReplies
  }>('/api/admin/social/comments/[id]', 'GET')

  const bulkActionApi = useApi<{ count: number }>('/api/admin/social/comments')

  const fetchData = useCallback(
    async (page: number) => {
      const res = await commentsApi.request(undefined, {
        params: {
          page,
          pageSize,
          search: searchParam || undefined,
          status: statusParam || undefined,
          targetType: targetTypeParam || undefined,
        },
        onError: (err: string) => toast.error(err),
      })

      if (res.success && res.data) {
        setComments(res.data.comments || [])
        setSelectedIds(current =>
          current.filter(id => res.data!.comments.some((c: Comment) => c.id === id))
        )
        setPagination({
          page: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
          totalPages: res.data.totalPages,
        })
      }
    },
    [commentsApi, pageSize, searchParam, statusParam, targetTypeParam]
  )

  useEffect(() => {
    void fetchData(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchParam, statusParam, pageSize])

  // Fetch comment details for replies modal
  const fetchCommentDetails = useCallback(async (commentId: string) => {
    const res = await commentDetailApi.request(undefined, {
      urlOverride: `/api/admin/social/comments/${commentId}`,
      onError: (err: string) => toast.error(err),
    })

    if (res.success && res.data) {
      setSelectedComment(res.data.comment)
      setIsRepliesModalOpen(true)
    }
  }, [commentDetailApi])

  const handleViewReplies = (comment: Comment & { repliesCount: number }) => {
    void fetchCommentDetails(comment.id)
  }

  const handleCloseRepliesModal = () => {
    setIsRepliesModalOpen(false)
    setSelectedComment(null)
  }

  const selectedCount = selectedIds.length
  const allSelected = comments.length > 0 && selectedIds.length === comments.length

  const handleToggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : comments.map(c => c.id))
  }

  const handleToggleSelect = (commentId: string) => {
    setSelectedIds(current =>
      current.includes(commentId) ? current.filter(id => id !== commentId) : [...current, commentId]
    )
  }

  const resetBulkState = () => {
    setPendingBulkAction(null)
    setIsBulkModalOpen(false)
  }

  const handleBulkAction = async (action: CommentBulkAction) => {
    if (selectedIds.length === 0) return

    const method = action === 'delete' ? 'DELETE' : 'PUT'
    const body =
      action === 'delete'
        ? { ids: selectedIds }
        : { ids: selectedIds, action: action === 'approve' ? 'approve' : 'reject' }

    const { success, data } = await bulkActionApi.request(body as Record<string, unknown>, {
      method: method as 'DELETE' | 'PUT',
      onError: (err: string) => toast.error(err),
    })

    if (success) {
      toast.success(
        t(action === 'delete' ? 'bulk_delete_success' : 'bulk_update_success', {
          count: data?.count ?? selectedIds.length,
        })
      )
      setSelectedIds([])
      resetBulkState()
      await fetchData(currentPage)
    }
  }

  const requestBulkAction = (action: CommentBulkAction) => {
    setPendingBulkAction(action)
    setIsBulkModalOpen(true)
  }

  const getBulkModalMessage = () => {
    if (!pendingBulkAction) return ''
    if (pendingBulkAction === 'approve') return t('bulk_approve_confirm', { count: selectedCount })
    if (pendingBulkAction === 'reject') return t('bulk_reject_confirm', { count: selectedCount })
    return t('bulk_delete_confirm', { count: selectedCount })
  }

  const getStatusBadge = (status: CommentStatus) => {
    const variants: Record<CommentStatus, 'success' | 'warning' | 'error' | 'ghost'> = {
      APPROVED: 'success',
      PENDING: 'warning',
      REJECTED: 'error',
    }
    return <StatusBadge status={t(`status_${status.toLowerCase()}`)} variant={variants[status]} />
  }

  const columns: Column<Comment & { repliesCount: number }>[] = [
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
      render: comment => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={selectedIds.includes(comment.id)}
          onChange={() => handleToggleSelect(comment.id)}
          aria-label={t('select_item')}
        />
      ),
    },
    {
      key: 'content',
      label: t('content'),
      render: comment => (
        <div className="max-w-md">
          <p className="truncate">{comment.content}</p>
          <div className="text-xs text-base-content/60 mt-1">
            {comment.user?.name || 'Unknown'} • {comment.targetType}/{comment.targetId}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('status'),
      render: comment => getStatusBadge(comment.status),
    },
    {
      key: 'replies',
      label: t('replies'),
      render: comment => (
        <button
          className="btn btn-xs btn-ghost"
          onClick={() => handleViewReplies(comment)}
          disabled={commentDetailApi.loading}
        >
          <MessageCircle size={14} className="mr-1" />
          {comment.repliesCount}
        </button>
      ),
    },
    {
      key: 'createdAt',
      label: t('created_at'),
      render: comment => (
        <span className="text-base-content/60">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-base-content/70">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <CommentStats />

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <select
          value={statusParam || ''}
          onChange={e => syncFilters({ status: e.target.value })}
          className="select select-bordered w-36"
        >
          <option value="">{t('all_status')}</option>
          <option value="PENDING">{t('status_pending')}</option>
          <option value="APPROVED">{t('status_approved')}</option>
          <option value="REJECTED">{t('status_rejected')}</option>
        </select>

        <select
          value={targetTypeParam || ''}
          onChange={e => syncFilters({ targetType: e.target.value })}
          className="select select-bordered w-36"
        >
          <option value="">{t('all_types')}</option>
          <option value="blog">{t('type_blog')}</option>
          <option value="page">{t('type_page')}</option>
          <option value="product">{t('type_product')}</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="alert bg-base-200 border border-base-300 flex flex-wrap items-center gap-3">
          <span className="font-medium">{t('selected_count', { count: selectedCount })}</span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              className="btn btn-sm btn-success"
              onClick={() => requestBulkAction('approve')}
              disabled={bulkActionApi.loading}
            >
              {t('bulk_approve')}
            </button>
            <button
              className="btn btn-sm btn-warning"
              onClick={() => requestBulkAction('reject')}
              disabled={bulkActionApi.loading}
            >
              {t('bulk_reject')}
            </button>
            <button
              className="btn btn-sm btn-error btn-outline"
              onClick={() => requestBulkAction('delete')}
              disabled={bulkActionApi.loading}
            >
              {t('bulk_delete')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])}>
              {t('clear_selection')}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <Table
        columns={columns}
        data={comments}
        loading={commentsApi.loading}
        emptyMessage={t('no_comments')}
        pagination={pagination}
        onPageSizeChange={handlePageSizeChange}
        onPageChange={handlePageChange}
        getRowKey={comment => comment.id}
      />

      <DeleteConfirmModal
        isOpen={isBulkModalOpen}
        onClose={resetBulkState}
        onConfirm={() => {
          if (pendingBulkAction) {
            void handleBulkAction(pendingBulkAction)
          }
        }}
        loading={bulkActionApi.loading}
        title={
          pendingBulkAction === 'delete'
            ? t('bulk_delete')
            : pendingBulkAction === 'approve'
              ? t('bulk_approve')
              : t('bulk_reject')
        }
        message={getBulkModalMessage()}
        warning={pendingBulkAction === 'delete' ? t('delete_warning') : undefined}
        confirmText={
          pendingBulkAction === 'delete'
            ? t('bulk_delete')
            : pendingBulkAction === 'approve'
              ? t('bulk_approve')
              : t('bulk_reject')
        }
      />

      {/* Replies Modal */}
      <RepliesModal
        isOpen={isRepliesModalOpen}
        onClose={handleCloseRepliesModal}
        comment={selectedComment}
        onRefresh={() => void fetchData(currentPage)}
      />
    </div>
  )
}
