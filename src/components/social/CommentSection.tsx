'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquare, Send, Reply, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { PaginationWrapper } from '@/components/ui/PaginationWrapper'
import { usePaginationWrapper } from '@/hooks/usePaginationWrapper'
import { useSession } from 'next-auth/react'
import { toast } from '@/lib/utils/toast'
import type { Comment, TargetType } from '@/types/social'

interface CommentSectionProps {
  targetType: TargetType
  targetId: string
}

export function CommentSection({
  targetType,
  targetId,
}: CommentSectionProps) {
  const t = useTranslations('social.comments')
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  // Settings states
  const [enableComments, setEnableComments] = useState(true)
  const [commentRequireApproval, setCommentRequireApproval] = useState(true)
  const [replyRequireApproval, setReplyRequireApproval] = useState(true)
  const [maxCommentLength, setMaxCommentLength] = useState(2000)
  const [maxReplyLength, setMaxReplyLength] = useState(2000)

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  // Fetch function for pagination
  const fetchComments = useCallback(
    async (page: number, pageSize: number) => {
      const res = await fetch(
        `/api/social/comments?targetType=${targetType}&targetId=${targetId}&page=${page}&pageSize=${pageSize}`
      )
      const result = await res.json()

      if (result.success && result.data) {
        // Update settings from API response
        if (result.data.settings) {
          setEnableComments(result.data.settings.enableComments)
          setCommentRequireApproval(result.data.settings.commentRequireApproval)
          setReplyRequireApproval(result.data.settings.replyRequireApproval)
          setMaxCommentLength(result.data.settings.maxCommentLength)
          setMaxReplyLength(result.data.settings.maxReplyLength)
        }

        return {
          items: result.data.comments || [],
          totalCount: result.data.total || 0,
        }
      }
      return { items: [], totalCount: 0 }
    },
    [targetType, targetId]
  )

  // Use pagination hook
  const {
    items: comments,
    totalCount,
    currentPage,
    pageSize,
    loading,
    goToPage,
    refresh,
  } = usePaginationWrapper<Comment>({ fetchFunction: fetchComments, pageSize: 10 })

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isLoggedIn) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/social/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), targetType, targetId }),
      })
      const result = await res.json()

      if (result.success) {
        setNewComment('')
        if (commentRequireApproval) {
          toast.info(t('pending_review'))
        }
        await refresh()
      } else {
        toast.error(result.message || t('submit_failed'))
      }
    } catch {
      toast.error(t('submit_failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim() || !isLoggedIn) return

    setIsSubmittingReply(true)
    try {
      const res = await fetch('/api/social/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: replyContent.trim() }),
      })
      const result = await res.json()

      if (result.success) {
        setReplyContent('')
        setReplyingTo(null)
        if (replyRequireApproval) {
          toast.info(t('pending_review'))
        }
        await refresh()
      } else {
        toast.error(result.message || t('submit_failed'))
      }
    } catch {
      toast.error(t('submit_failed'))
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Render comments
  const renderComments = (items: unknown[]) => (
    <div className="space-y-4">
      {items.map(comment => {
        const c = comment as Comment
        const hasReplies = c.replies && c.replies.length > 0
        const repliesExpanded = expandedReplies.has(c.id)

        return (
          <div key={c.id} className="space-y-3">
            {/* Comment */}
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                      <span className="text-sm">
                        {c.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {c.user?.name || t('anonymous')}
                      </span>
                      <span className="text-sm text-base-content/60">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <button
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      >
                        <Reply className="w-3 h-3" />
                        {t('reply')}
                      </button>
                      {hasReplies && (
                        <button
                          className="btn btn-ghost btn-xs gap-1"
                          onClick={() => toggleReplies(c.id)}
                        >
                          {repliesExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              {t('hide_replies')}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              {t('show_replies', { count: c.replies!.length })}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Form */}
            {replyingTo === c.id && (
              <div className="ml-12 space-y-2">
                <div className="relative">
                  <Textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value.slice(0, maxReplyLength))}
                    placeholder={t('reply_placeholder')}
                    rows={2}
                    className="w-full"
                    disabled={isSubmittingReply}
                  />
                  {!enableComments && (
                    <div className="absolute inset-0 bg-base-100/60 flex flex-col items-center justify-center rounded-lg pointer-events-none">
                      <div className="alert alert-warning py-2">
                        <Info className="w-4 h-4" />
                        <span>{t('comments_disabled')}</span>
                      </div>
                    </div>
                  )}
                  {isSubmittingReply && (
                    <div className="absolute inset-0 bg-base-100/80 flex items-center justify-center rounded-lg">
                      <div className="alert alert-info py-2">
                        <span className="loading loading-spinner loading-sm" />
                        <span>{t('pending_review')}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-base-content/60">
                      {replyContent.length}/{maxReplyLength}
                    </span>
                    {replyRequireApproval && (
                      <span className="text-xs text-base-content/50">{t('approval_required')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => void handleSubmitReply(c.id)}
                      loading={isSubmittingReply}
                      disabled={!replyContent.trim() || isSubmittingReply || !enableComments}
                    >
                      {t('submit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Replies */}
            {hasReplies && repliesExpanded && (
              <div className="ml-12 space-y-2">
                {c.replies!.map(reply => (
                  <div key={reply.id} className="card bg-base-200 border border-base-300">
                    <div className="card-body p-3">
                      <div className="flex items-start gap-2">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-8">
                            <span className="text-xs">
                              {reply.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {reply.user?.name || t('anonymous')}
                            </span>
                            <span className="text-xs text-base-content/60">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-xl font-bold">
          {t('title')} ({totalCount})
        </h2>
      </div>

      {/* New Comment Form */}
      {isLoggedIn ? (
        <div className="space-y-3">
          <div className="relative">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value.slice(0, maxCommentLength))}
              placeholder={t('placeholder')}
              rows={3}
              className="w-full"
              disabled={!enableComments}
            />
            {!enableComments && (
              <div className="absolute inset-0 bg-base-100/60 flex flex-col items-center justify-center rounded-lg pointer-events-none">
                <div className="flex items-center gap-2 opacity-50">
                  <Info className="w-4 h-4" />
                  <span>{t('comments_disabled')}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">
                {newComment.length}/{maxCommentLength}
              </span>
              {commentRequireApproval && (
                <span className="text-xs text-base-content/50">{t('approval_required')}</span>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => void handleSubmitComment()}
              loading={isSubmitting}
              disabled={!newComment.trim() || !enableComments}
              leftIcon={<Send className="w-4 h-4" />}
            >
              {t('submit')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="alert">
          <span>{t('login_required')}</span>
        </div>
      )}

      {/* Comments List with PaginationWrapper */}
      <PaginationWrapper
        type="traditional"
        items={comments}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        loading={loading}
        onPageChange={goToPage}
        renderData={renderComments}
        noMoreText={t('no_comments')}
      />
    </div>
  )
}
