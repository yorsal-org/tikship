'use client'

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, FileEdit, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { StatCard, StatsGrid } from '@/components/ui/StatsCard'
import { useApi } from '@/hooks/useApi'
import type { PostStatsData, PostType } from '@/types/post'

interface PostStatsProps {
  type: PostType
}

export function PostStats({ type }: PostStatsProps) {
  const t = useTranslations('admin.posts.stats')
  const [stats, setStats] = useState<PostStatsData | null>(null)

  const statsApi = useApi<PostStatsData>('/api/admin/posts/stats', 'GET')

  useEffect(() => {
    const fetchStats = async () => {
      const statsRes = await statsApi.request(undefined, { params: { type } })
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
    }
    void fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

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
      label: t('total', { type }),
      value: stats.total,
      icon: FileText,
      color: 'text-primary',
    },
    {
      label: t('published'),
      value: stats.published,
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      label: t('draft'),
      value: stats.draft,
      icon: FileEdit,
      color: 'text-warning',
    },
    {
      label: t('trash'),
      value: stats.trash,
      icon: Trash2,
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
