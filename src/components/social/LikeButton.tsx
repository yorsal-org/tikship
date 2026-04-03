'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Heart, Info } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils/common'
import type { TargetType } from '@/types/social'

interface LikeButtonProps {
  targetType: TargetType
  targetId: string
  className?: string
}

export function LikeButton({ targetType, targetId, className }: LikeButtonProps) {
  const t = useTranslations('social.likes')
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  const [count, setCount] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [enableLikes, setEnableLikes] = useState(true)

  const fetchLikeInfo = useCallback(async () => {
    setIsLoading(true)
    const res = await fetch(`/api/social/likes?targetType=${targetType}&targetId=${targetId}`)
    const json = await res.json()
    setIsLoading(false)

    if (json.success && json.data) {
      setCount(json.data.count || 0)
      setUserLiked(json.data.userLiked || false)
      setEnableLikes(json.data.enableLikes !== false)
    }
  }, [targetType, targetId])

  useEffect(() => {
    void fetchLikeInfo()
  }, [fetchLikeInfo])

  const handleToggleLike = async () => {
    if (!isLoggedIn || !enableLikes) return

    // Optimistic update
    const previousCount = count
    const previousLiked = userLiked
    setCount(c => (userLiked ? c - 1 : c + 1))
    setUserLiked(!userLiked)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    const res = await fetch('/api/social/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId }),
    })
    const json = await res.json()

    // Revert if failed
    if (!json.success) {
      setCount(previousCount)
      setUserLiked(previousLiked)
    }
  }

  const isDisabled = !isLoggedIn || isLoading || !enableLikes

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => void handleToggleLike()}
        disabled={isDisabled}
        className={cn(
          'btn btn-ghost gap-2 transition-all',
          userLiked && 'text-error',
          isAnimating && 'scale-110',
          !enableLikes && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={
          !enableLikes
            ? t('likes_disabled')
            : !isLoggedIn
              ? t('login_required')
              : t('like')
        }
      >
        <Heart
          className={cn(
            'w-5 h-5 transition-all',
            userLiked && 'fill-current'
          )}
        />
        <span className="font-medium">{count}</span>
      </button>
      {!enableLikes && (
        <span className="text-xs text-base-content/50 tooltip tooltip-bottom" data-tip={t('likes_disabled')}>
          <Info className="w-3 h-3" />
        </span>
      )}
    </div>
  )
}
