'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import type { Comment, Reply, CommentStatus } from '@/types/social'
import { MessageCircle, Check, X, Trash2 } from 'lucide-react'

interface RepliesModalProps {
  isOpen: boolean
  onClose: () => void
  comment: Comment | null
  onRefresh: () => void
}

export function RepliesModal({
  isOpen,
  onClose,
  comment,
  onRefresh,
}: RepliesModalProps) {
  const t = useTranslations('admin.social.comments')

  const [replies, setReplies] = useState<Reply[]>([])
  const [replyToDelete, setReplyToDelete] = useState<Reply | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Update replies when comment changes
  useEffect(() => {
    if (comment?.replies) {
      setReplies(comment.replies)
    } else {
      setReplies([])
    }
  }, [comment])

  const updateReplyStatusApi = useApi('/api/admin/social/comments/[id]/replies')
  const deleteReplyApi = useApi('/api/admin/social/comments/[id]/replies')

  const handleApprove = useCallback(
    async (reply: Reply) => {
      if (!comment) return

      const { success } = await updateReplyStatusApi.request(
        { replyId: reply.id, status: 'APPROVED' as CommentStatus },
        {
          method: 'PUT',
          urlOverride: `/api/admin/social/comments/${comment.id}/replies`,
          onError: (err: string) => toast.error(err),
        }
      )

      if (success) {
        toast.success(t('reply_approved'))
        setReplies(current =>
          current.map(r => (r.id === reply.id ? { ...r, status: 'APPROVED' as CommentStatus } : r))
        )
        onRefresh()
      }
    },
    [comment, updateReplyStatusApi, t, onRefresh]
  )

  const handleReject = useCallback(
    async (reply: Reply) => {
      if (!comment) return

      const { success } = await updateReplyStatusApi.request(
        { replyId: reply.id, status: 'REJECTED' as CommentStatus },
        {
          method: 'PUT',
          urlOverride: `/api/admin/social/comments/${comment.id}/replies`,
          onError: (err: string) => toast.error(err),
        }
      )

      if (success) {
        toast.success(t('reply_rejected'))
        setReplies(current =>
          current.map(r => (r.id === reply.id ? { ...r, status: 'REJECTED' as CommentStatus } : r))
        )
        onRefresh()
      }
    },
    [comment, updateReplyStatusApi, t, onRefresh]
  )

  const handleDeleteRequest = (reply: Reply) => {
    setReplyToDelete(reply)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = useCallback(async () => {
    if (!comment || !replyToDelete) return

    const { success } = await deleteReplyApi.request(
      { replyId: replyToDelete.id },
      {
        method: 'DELETE',
        urlOverride: `/api/admin/social/comments/${comment.id}/replies`,
        onError: (err: string) => toast.error(err),
      }
    )

    if (success) {
      toast.success(t('reply_deleted'))
      setReplies(current => current.filter(r => r.id !== replyToDelete.id))
      setReplyToDelete(null)
      setIsDeleteModalOpen(false)
      onRefresh()
    }
  }, [comment, replyToDelete, deleteReplyApi, t, onRefresh])

  const getStatusBadge = (status: CommentStatus) => {
    const variants: Record<CommentStatus, 'success' | 'warning' | 'error' | 'ghost'> = {
      APPROVED: 'success',
      PENDING: 'warning',
      REJECTED: 'error',
    }
    return <StatusBadge status={t(`status_${status.toLowerCase()}`)} variant={variants[status]} />
  }

  if (!comment) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('view_replies_title')}
        maxWidth="2xl"
        showCloseButton
      >
        {/* Parent Comment Preview */}
        <div className="mb-6 p-4 bg-base-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{comment.user?.name || 'Unknown'}</span>
            <StatusBadge
              status={t(`status_${comment.status.toLowerCase()}`)}
              variant={
                comment.status === 'APPROVED'
                  ? 'success'
                  : comment.status === 'PENDING'
                    ? 'warning'
                    : 'error'
              }
            />
          </div>
          <p className="text-base-content/80">{comment.content}</p>
        </div>

        {/* Replies List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <MessageCircle size={18} />
            <span className="font-medium">
              {t('replies_count', { count: replies.length })}
            </span>
          </div>

          {replies.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              {t('no_replies')}
            </div>
          ) : (
            replies.map(reply => (
              <div
                key={reply.id}
                className="p-4 bg-base-100 border border-base-300 rounded-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">
                        {reply.user?.name || 'Unknown'}
                      </span>
                      {getStatusBadge(reply.status)}
                      <span className="text-xs text-base-content/60">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-base-content/80">{reply.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {reply.status === 'PENDING' && (
                      <>
                        <button
                          className="btn btn-xs btn-success btn-outline"
                          onClick={() => handleApprove(reply)}
                          disabled={updateReplyStatusApi.loading}
                          title={t('approve')}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="btn btn-xs btn-warning btn-outline"
                          onClick={() => handleReject(reply)}
                          disabled={updateReplyStatusApi.loading}
                          title={t('reject')}
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-xs btn-error btn-outline"
                      onClick={() => handleDeleteRequest(reply)}
                      disabled={deleteReplyApi.loading}
                      title={t('delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="modal-action">
          <Button onClick={onClose} className="btn-ghost">
            {t('close')}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setReplyToDelete(null)
          setIsDeleteModalOpen(false)
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleteReplyApi.loading}
        title={t('delete_reply')}
        message={t('delete_reply_confirm', {
          name: replyToDelete?.user?.name || 'Unknown',
        })}
        warning={t('delete_warning')}
        confirmText={t('delete')}
      />
    </>
  )
}
