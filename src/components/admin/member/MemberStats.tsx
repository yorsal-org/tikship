'use client'

import { useTranslations } from 'next-intl'
import { Users, UserPlus, Activity, TrendingUp } from 'lucide-react'
import { StatCard, StatsGrid } from '@/components/ui/StatsCard'
import { MemberStats as MemberStatsType } from '@/types/admin'

export function MemberStats({ stats }: { stats: MemberStatsType | null }) {
  const t = useTranslations('admin.members.stats')

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
      label: t('total'),
      value: stats.totalUsers,
      icon: Users,
      color: 'text-primary',
    },
    {
      label: t('new_today'),
      value: stats.newToday,
      icon: UserPlus,
      color: 'text-success',
    },
    {
      label: t('active_7d'),
      value: stats.active7d,
      icon: Activity,
      color: 'text-info',
    },
    {
      label: t('conversion'),
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-warning',
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
