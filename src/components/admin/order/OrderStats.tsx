'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart, DollarSign, CheckCircle, ChevronDown } from 'lucide-react'
import { StatCard, StatsGrid } from '@/components/ui/StatsCard'
import { useApi } from '@/hooks/useApi'
import type { OrderStats as OrderStatsData } from '@/types/order'

export function OrderStats() {
  const t = useTranslations('admin.orders')
  const [stats, setStats] = useState<OrderStatsData | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')

  const statsApi = useApi<OrderStatsData>('/api/admin/orders/stats', 'GET')

  useEffect(() => {
    const fetchStats = async () => {
      const statsRes = await statsApi.request(undefined)
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
        // Set default currency to first one
        if (statsRes.data.totalRevenueByCurrency.length > 0) {
          setSelectedCurrency(statsRes.data.totalRevenueByCurrency[0].currency)
        }
      }
    }
    void fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!stats) {
    return (
      <StatsGrid columns={5}>
        {[...Array(5)].map((_, i) => (
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

  const selectedRevenueItem = stats.totalRevenueByCurrency.find(
    item => item.currency === selectedCurrency
  )

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const statCards = [
    {
      label: t('stats_total'),
      value: stats.total,
      icon: ShoppingCart,
      color: 'text-primary',
    },
    {
      label: t('stats_completed'),
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      label: t('stats_pending'),
      value: stats.pending,
      icon: ShoppingCart,
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

      {/* Revenue Card with Currency Dropdown */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-info" />
              <h3 className="text-sm font-medium">{t('stats_revenue')}</h3>
            </div>
            {stats.totalRevenueByCurrency.length > 1 && (
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-xs gap-1">
                  {selectedCurrency.toUpperCase()}
                  <ChevronDown className="w-3 h-3" />
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-32"
                >
                  {stats.totalRevenueByCurrency.map(item => (
                    <li key={item.currency}>
                      <a
                        onClick={() => setSelectedCurrency(item.currency)}
                        className={selectedCurrency === item.currency ? 'active' : ''}
                      >
                        {item.currency.toUpperCase()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <div className="text-2xl font-bold text-info">
              {selectedRevenueItem
                ? formatCurrency(selectedRevenueItem.amount, selectedRevenueItem.currency)
                : '$0.00'}
            </div>
            {stats.totalRevenueByCurrency.length > 1 && (
              <div className="text-xs text-base-content/60 mt-1">
                {stats.totalRevenueByCurrency.length} currencies
              </div>
            )}
          </div>
        </div>
      </div>
    </StatsGrid>
  )
}
