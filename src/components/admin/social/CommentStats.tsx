'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { MessageCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { StatCard, StatsGrid } from '@/components/ui/StatsCard'
import { useApi } from '@/hooks/useApi'

interface CommentStatsData {
  total: number
  approved: number
  pending: number
  rejected: number
}

export function CommentStats() {
  const t = useTranslations('admin.social.comments')
  const [stats, setStats] = useState<CommentStatsData | null>(null)

  const statsApi = useApi<CommentStatsData>('/api/admin/social/comments/stats', 'GET')

  useEffect(() => {
    const fetchStats = async () => {
      const statsRes = await statsApi.request(undefined)
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
    }
    void fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!stats) {
    return (
      <StatsGrid columns={4}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="skeleton h-4 w-20"></div>
              <div className="skeleton h-8 w-16"></div>
            </div>
          </div>
        ))}
      </StatsGrid>
    )
  }

  const statCards = [
    {
      label: t('stats_total'),
      value: stats.total,
      icon: MessageCircle,
      color: 'text-primary',
    },
    {
      label: t('stats_approved'),
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      label: t('stats_pending'),
      value: stats.pending,
      icon: Clock,
      color: 'text-warning',
    },
    {
      label: t('stats_rejected'),
      value: stats.rejected,
      icon: XCircle,
      color: 'text-error',
    },
  ]

  return (
    <StatsGrid columns={4}>
      {statCards.map((stat, index) => (
        <StatCard
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </StatsGrid>
  )
}
