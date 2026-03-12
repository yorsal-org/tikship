'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import {
  Users,
  Shield,
  Key,
  FileText,
  UserPlus,
  Activity,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useApi } from '@/hooks/useApi'
import type { DashboardStats } from '@/types/admin'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const statsApi = useApi<DashboardStats>('/api/admin/dashboard/stats', 'GET')

  const adminPath = siteConfig.admin.path

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError(false)
    const result = await statsApi.request(undefined)
    if (result.success && result.data) {
      setStats(result.data)
    } else {
      setError(true)
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-3 text-lg">{t('loading')}</span>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-error mb-4" />
        <p className="text-lg mb-4">{t('error')}</p>
        <button onClick={fetchStats} className="btn btn-primary">
          {t('retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold">{t('title')}</h1>
      </div>

      {/* System Stats */}
      <div>
        <h2 className="text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t('system_management')}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stats shadow bg-linear-to-br from-primary/10 to-primary/5">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Users className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_users')}</div>
              <div className="stat-value text-primary">{stats.adminUsers.total}</div>
              <div className="stat-desc">
                {t('active_admins')}: {stats.adminUsers.active}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-secondary/10 to-secondary/5">
            <div className="stat">
              <div className="stat-figure text-secondary">
                <Shield className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_roles')}</div>
              <div className="stat-value text-secondary">{stats.roles.total}</div>
              <div className="stat-desc">
                {t('system_roles')}: {stats.roles.default}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-accent/10 to-accent/5">
            <div className="stat">
              <div className="stat-figure text-accent">
                <Key className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_permissions')}</div>
              <div className="stat-value text-accent">{stats.permissions.total}</div>
              <div className="stat-desc">{t('system_permissions')}</div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-info/10 to-info/5">
            <div className="stat">
              <div className="stat-figure text-info">
                <FileText className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('audit_logs')}</div>
              <div className="stat-value text-info">{stats.auditLogs.total}</div>
              <div className="stat-desc">
                {t('recent_activities')}: {stats.auditLogs.recent}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {t('user_data')}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="stats shadow bg-linear-to-br from-success/10 to-success/5">
            <div className="stat">
              <div className="stat-figure text-success">
                <Users className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_members')}</div>
              <div className="stat-value text-success">{stats.members.total}</div>
              <div className="stat-desc">
                {t('new_members_today')}: {stats.members.newToday}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-warning/10 to-warning/5">
            <div className="stat">
              <div className="stat-figure text-warning">
                <Activity className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('active_members_7d')}</div>
              <div className="stat-value text-warning">{stats.members.activeLast7Days}</div>
              <div className="stat-desc">
                {stats.members.total > 0
                  ? `${((stats.members.activeLast7Days / stats.members.total) * 100).toFixed(1)}%`
                  : '0%'}{' '}
                {t('active_rate')}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-error/10 to-error/5">
            <div className="stat">
              <div className="stat-figure text-error">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('growth_trend')}</div>
              <div className="stat-value text-error">
                {stats.members.newToday > 0 ? '+' : ''}
                {stats.members.newToday}
              </div>
              <div className="stat-desc">{t('new_today')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Commerce Stats */}
      <div>
        <h2 className="text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          {t('business_data')}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="stats shadow bg-linear-to-br from-primary/10 to-primary/5">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Package className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_products')}</div>
              <div className="stat-value text-primary">{stats.products.total}</div>
              <div className="stat-desc">
                {t('active_products')}: {stats.products.active}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-success/10 to-success/5">
            <div className="stat">
              <div className="stat-figure text-success">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_orders')}</div>
              <div className="stat-value text-success">{stats.orders.total}</div>
              <div className="stat-desc">
                {t('completed_orders')}: {stats.orders.completed}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-warning/10 to-warning/5">
            <div className="stat">
              <div className="stat-figure text-warning">
                <Activity className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('pending_orders')}</div>
              <div className="stat-value text-warning">{stats.orders.pending}</div>
              <div className="stat-desc">
                {t('failed_orders')}: {stats.orders.failed}
              </div>
            </div>
          </div>
        </div>

        {/* Total Revenue - Full Width */}
        <div className="mt-3">
          <div className="stats shadow bg-linear-to-br from-info/10 to-info/5 w-full">
            <div className="stat">
              <div className="stat-figure text-info">
                <DollarSign className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_revenue')}</div>
              <div className="stat-value text-info">
                {stats.revenue.byCurrency.length > 0 ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                    {stats.revenue.byCurrency.map((item, index) => (
                      <span key={item.currency} className="text-xl lg:text-2xl whitespace-nowrap">
                        {formatCurrency(item.amount, item.currency)}
                        {index < stats.revenue.byCurrency.length - 1 && (
                          <span className="text-base-content/30 mx-2">|</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xl lg:text-2xl">$0.00</div>
                )}
              </div>
              <div className="stat-desc mt-2">
                <div className="text-xs opacity-70">{t('revenue_last_month')}:</div>
                {stats.revenue.lastMonth.length > 0 ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {stats.revenue.lastMonth.map((item, index) => (
                      <span key={item.currency} className="text-sm whitespace-nowrap">
                        {formatCurrency(item.amount, item.currency)}
                        {index < stats.revenue.lastMonth.length - 1 && (
                          <span className="opacity-50 mx-2">|</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">$0.00</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        {/* User Growth Chart */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 lg:p-6">
            <h2 className="card-title text-base lg:text-lg">{t('user_growth')}</h2>
            <p className="text-xs lg:text-sm text-base-content/70 mb-4">{t('user_growth_desc')}</p>
            {stats.charts.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    labelFormatter={label => `${t('date')}: ${label}`}
                    formatter={value => [value ?? 0, t('new_users')]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name={t('new_users')}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-base-content/50">
                {t('no_data')}
              </div>
            )}
          </div>
        </div>

        {/* Order Trend Chart */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 lg:p-6">
            <h2 className="card-title text-base lg:text-lg">{t('order_trend')}</h2>
            <p className="text-xs lg:text-sm text-base-content/70 mb-4">{t('order_trend_desc')}</p>
            {stats.charts.orderTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.charts.orderTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    labelFormatter={label => `${t('date')}: ${label}`}
                    formatter={(value, name, props) => {
                      if (name === t('order_count')) {
                        return [value, name]
                      }
                      // For revenue, show all currencies
                      const item = props.payload as { revenueByCurrency: Array<{ currency: string; amount: number }> }
                      if (item.revenueByCurrency && item.revenueByCurrency.length > 0) {
                        return [
                          item.revenueByCurrency
                            .map(r => formatCurrency(r.amount, r.currency))
                            .join(', '),
                          t('revenue'),
                        ]
                      }
                      return ['$0.00', t('revenue')]
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="#10b981"
                    name={t('order_count')}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-base-content/50">
                {t('no_data')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4 lg:p-6">
          <h2 className="card-title text-base lg:text-lg mb-4">{t('quick_actions')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 lg:gap-4">
            <Link href={`${adminPath}/users`} className="btn btn-primary btn-sm lg:btn-md">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t('manage_users')}</span>
            </Link>
            <Link href={`${adminPath}/roles`} className="btn btn-secondary btn-sm lg:btn-md">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{t('manage_roles')}</span>
            </Link>
            <Link href={`${adminPath}/audit-logs`} className="btn btn-accent btn-sm lg:btn-md">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('view_logs')}</span>
            </Link>
            <Link href={`${adminPath}/members`} className="btn btn-info btn-sm lg:btn-md">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('member_management')}</span>
            </Link>
            <Link href={`${adminPath}/products`} className="btn btn-success btn-sm lg:btn-md">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">{t('product_management')}</span>
            </Link>
            <Link href={`${adminPath}/orders`} className="btn btn-warning btn-sm lg:btn-md">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{t('order_management')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
