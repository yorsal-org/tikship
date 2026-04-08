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
  BookOpen,
  Folder,
  Tags,
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
import { useModuleState } from '@/components/providers/ModuleStateProvider'
import Link from 'next/link'
import { siteConfig } from '@/config/site'

interface AdminStats {
  adminUsers: { total: number; active: number }
  roles: { total: number; default: number }
  permissions: { total: number }
  auditLogs: { total: number; recent: number }
}

interface UserStats {
  members: { total: number; newToday: number; activeLast7Days: number }
  charts: { userGrowth: Array<{ date: string; count: number }> }
}

interface CommerceStats {
  products: { total: number; active: number }
  orders: { total: number; completed: number; pending: number; failed: number }
  revenue: { byCurrency: Array<{ currency: string; amount: number }>; lastMonth: Array<{ currency: string; amount: number }> }
  charts: { orderTrend: Array<{ date: string; count: number; revenueByCurrency: Array<{ currency: string; amount: number }> }> }
}

interface ContentStats {
  posts: { total: number; published: number; draft: number }
  categories: { total: number }
  tags: { total: number }
  charts: { postTrend: Array<{ date: string; count: number }> }
}

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard')
  const { moduleState } = useModuleState()
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [commerceStats, setCommerceStats] = useState<CommerceStats | null>(null)
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const adminStatsApi = useApi<AdminStats>('/api/admin/dashboard/widgets/admin-stats', 'GET')
  const userStatsApi = useApi<UserStats>('/api/admin/dashboard/widgets/user-stats', 'GET')
  const commerceStatsApi = useApi<CommerceStats>('/api/admin/dashboard/widgets/commerce-stats', 'GET')
  const contentStatsApi = useApi<ContentStats>('/api/admin/dashboard/widgets/content-stats', 'GET')

  const adminPath = siteConfig.admin.path

  useEffect(() => {
    fetchAllStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAllStats = async () => {
    setLoading(true)
    setError(false)

    try {
      // Fetch admin stats (always needed)
      const adminResult = await adminStatsApi.request(undefined)
      if (!adminResult.success || !adminResult.data) {
        setError(true)
        setLoading(false)
        return
      }
      setAdminStats(adminResult.data)

      // Fetch user stats if module enabled
      if (moduleState?.user) {
        const userResult = await userStatsApi.request(undefined)
        if (userResult.success && userResult.data) {
          setUserStats(userResult.data)
        }
      }

      // Fetch commerce stats if module enabled
      if (moduleState?.commerce) {
        const commerceResult = await commerceStatsApi.request(undefined)
        if (commerceResult.success && commerceResult.data) {
          setCommerceStats(commerceResult.data)
        }
      }

      // Fetch content stats if module enabled
      if (moduleState?.content) {
        const contentResult = await contentStatsApi.request(undefined)
        if (contentResult.success && contentResult.data) {
          setContentStats(contentResult.data)
        }
      }
    } catch {
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

  if (error || !adminStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-error mb-4" />
        <p className="text-lg mb-4">{t('error')}</p>
        <button onClick={fetchAllStats} className="btn btn-primary">
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
              <div className="stat-value text-primary">{adminStats.adminUsers.total}</div>
              <div className="stat-desc">
                {t('active_admins')}: {adminStats.adminUsers.active}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-secondary/10 to-secondary/5">
            <div className="stat">
              <div className="stat-figure text-secondary">
                <Shield className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_roles')}</div>
              <div className="stat-value text-secondary">{adminStats.roles.total}</div>
              <div className="stat-desc">
                {t('system_roles')}: {adminStats.roles.default}
              </div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-accent/10 to-accent/5">
            <div className="stat">
              <div className="stat-figure text-accent">
                <Key className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('total_permissions')}</div>
              <div className="stat-value text-accent">{adminStats.permissions.total}</div>
              <div className="stat-desc">{t('system_permissions')}</div>
            </div>
          </div>

          <div className="stats shadow bg-linear-to-br from-info/10 to-info/5">
            <div className="stat">
              <div className="stat-figure text-info">
                <FileText className="w-8 h-8" />
              </div>
              <div className="stat-title">{t('audit_logs')}</div>
              <div className="stat-value text-info">{adminStats.auditLogs.total}</div>
              <div className="stat-desc">
                {t('recent_activities')}: {adminStats.auditLogs.recent}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Stats */}
      {contentStats && (
        <div>
          <h2 className="text-lg lg:text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t('content_data')}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="stats shadow bg-linear-to-br from-primary/10 to-primary/5">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="stat-title">{t('total_posts')}</div>
                <div className="stat-value text-primary">{contentStats.posts.total}</div>
                <div className="stat-desc">
                  {t('published')}: {contentStats.posts.published} | {t('draft')}: {contentStats.posts.draft}
                </div>
              </div>
            </div>

            <div className="stats shadow bg-linear-to-br from-secondary/10 to-secondary/5">
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Folder className="w-8 h-8" />
                </div>
                <div className="stat-title">{t('total_categories')}</div>
                <div className="stat-value text-secondary">{contentStats.categories.total}</div>
              </div>
            </div>

            <div className="stats shadow bg-linear-to-br from-accent/10 to-accent/5">
              <div className="stat">
                <div className="stat-figure text-accent">
                  <Tags className="w-8 h-8" />
                </div>
                <div className="stat-title">{t('total_tags')}</div>
                <div className="stat-value text-accent">{contentStats.tags.total}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Stats */}
      {userStats && (
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
                <div className="stat-value text-success">{userStats.members.total}</div>
                <div className="stat-desc">
                  {t('new_members_today')}: {userStats.members.newToday}
                </div>
              </div>
            </div>

            <div className="stats shadow bg-linear-to-br from-warning/10 to-warning/5">
              <div className="stat">
                <div className="stat-figure text-warning">
                  <Activity className="w-8 h-8" />
                </div>
                <div className="stat-title">{t('active_members_7d')}</div>
                <div className="stat-value text-warning">{userStats.members.activeLast7Days}</div>
                <div className="stat-desc">
                  {userStats.members.total > 0
                    ? `${((userStats.members.activeLast7Days / userStats.members.total) * 100).toFixed(1)}%`
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
                  {userStats.members.newToday > 0 ? '+' : ''}
                  {userStats.members.newToday}
                </div>
                <div className="stat-desc">{t('new_today')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commerce Stats */}
      {commerceStats && (
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
                <div className="stat-value text-primary">{commerceStats.products.total}</div>
                <div className="stat-desc">
                  {t('active_products')}: {commerceStats.products.active}
                </div>
              </div>
            </div>

            <div className="stats shadow bg-linear-to-br from-success/10 to-success/5">
              <div className="stat">
                <div className="stat-figure text-success">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="stat-title">{t('total_orders')}</div>
                <div className="stat-value text-success">{commerceStats.orders.total}</div>
                <div className="stat-desc">
                  {t('completed_orders')}: {commerceStats.orders.completed}
                </div>
              </div>
            </div>

            <div className="stats shadow bg-linear-to-br from-warning/10 to-warning/5">
              <div className="stat">
                <div className="stat-figure text-warning">
                  <Activity className="w-8 h-8" />
                </div>
                <div className="stat-title">{t('pending_orders')}</div>
                <div className="stat-value text-warning">{commerceStats.orders.pending}</div>
                <div className="stat-desc">
                  {t('failed_orders')}: {commerceStats.orders.failed}
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
                  {commerceStats.revenue.byCurrency.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                      {commerceStats.revenue.byCurrency.map((item, index) => (
                        <span key={item.currency} className="text-xl lg:text-2xl whitespace-nowrap">
                          {formatCurrency(item.amount, item.currency)}
                          {index < commerceStats.revenue.byCurrency.length - 1 && (
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
                  {commerceStats.revenue.lastMonth.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {commerceStats.revenue.lastMonth.map((item, index) => (
                        <span key={item.currency} className="text-sm whitespace-nowrap">
                          {formatCurrency(item.amount, item.currency)}
                          {index < commerceStats.revenue.lastMonth.length - 1 && (
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
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        {/* User Growth Chart */}
        {userStats && userStats.charts.userGrowth.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 lg:p-6">
              <h2 className="card-title text-base lg:text-lg">{t('user_growth')}</h2>
              <p className="text-xs lg:text-sm text-base-content/70 mb-4">{t('user_growth_desc')}</p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userStats.charts.userGrowth}>
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
            </div>
          </div>
        )}

        {/* Order Trend Chart */}
        {commerceStats && commerceStats.charts.orderTrend.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 lg:p-6">
              <h2 className="card-title text-base lg:text-lg">{t('order_trend')}</h2>
              <p className="text-xs lg:text-sm text-base-content/70 mb-4">{t('order_trend_desc')}</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={commerceStats.charts.orderTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    labelFormatter={label => `${t('date')}: ${label}`}
                    formatter={(value, name) => {
                      if (name === t('order_count')) {
                        return [value, name]
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
            </div>
          </div>
        )}
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
            {contentStats && (
              <Link href={`${adminPath}/articles`} className="btn btn-info btn-sm lg:btn-md">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">{t('article_management')}</span>
              </Link>
            )}
            {userStats && (
              <Link href={`${adminPath}/members`} className="btn btn-success btn-sm lg:btn-md">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('member_management')}</span>
              </Link>
            )}
            {commerceStats && (
              <>
                <Link href={`${adminPath}/products`} className="btn btn-warning btn-sm lg:btn-md">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('product_management')}</span>
                </Link>
                <Link href={`${adminPath}/orders`} className="btn btn-error btn-sm lg:btn-md">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('order_management')}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
