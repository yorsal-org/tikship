'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { Table, Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { siteConfig } from '@/config/site'
import { AuditLog, AuditLogsListResponse } from '@/types/admin'
import { useAdminPagination as usePagination } from '@/hooks/useAdminPagination'
import { truncateId } from '@/lib/utils/string'
import { getAuditActionVariant, getBadgeClassName } from '@/lib/utils/badge'
import { formatters } from '@/lib/utils/formatters'

export default function AuditLogsPage() {
  const t = useTranslations('admin.audit_logs')
  const {
    page: currentPage,
    handlePageChange,
    handleFilterChange: syncFilters,
    getParam,
    pageSize,
  } = usePagination({ pageSize: siteConfig.admin.pageSize })

  const actionParam = getParam('action')
  const resourceParam = getParam('resource')

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filters, setFilters] = useState({
    action: actionParam || '',
    resource: resourceParam || '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: siteConfig.admin.pageSize,
    total: 0,
    totalPages: 0,
  })

  const [cleanupModalOpen, setCleanupModalOpen] = useState(false)
  const [pendingDays, setPendingDays] = useState<number | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const CLEANUP_OPTIONS: { labelKey: string; days: number }[] = [
    { labelKey: 'cleanup_before_10_days', days: 10 },
    { labelKey: 'cleanup_before_1_month', days: 30 },
    { labelKey: 'cleanup_before_60_days', days: 60 },
    { labelKey: 'cleanup_before_6_months', days: 180 },
    { labelKey: 'cleanup_before_1_year', days: 365 },
  ]

  const handleCleanupSelect = (days: number) => {
    setPendingDays(days)
    setCleanupModalOpen(false)
    setConfirmModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDays) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/audit-logs?days=${pendingDays}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.data) {
        const count: number = json.data.deletedCount
        if (count === 0) {
          toast.info(t('cleanup_empty'))
        } else {
          toast.success(t('cleanup_success', { count }))
        }
        setConfirmModalOpen(false)
        fetchLogs(1)
      } else {
        toast.error(json.error || t('cleanup_warning'))
      }
    } catch {
      toast.error(t('cleanup_warning'))
    } finally {
      setIsDeleting(false)
    }
  }

  // API
  const auditLogsApi = useApi<AuditLogsListResponse>('/api/admin/audit-logs', 'GET')

  // Debounce filters sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasActionChanged = filters.action !== (actionParam || '')
      const hasResourceChanged = filters.resource !== (resourceParam || '')

      if (hasActionChanged || hasResourceChanged) {
        syncFilters({
          action: filters.action || undefined,
          resource: filters.resource || undefined,
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.action, filters.resource, actionParam, resourceParam, syncFilters])

  const updateFilterState = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const fetchLogs = useCallback(
    async (page: number) => {
      const { success, data: result } = await auditLogsApi.request(undefined, {
        params: {
          page,
          pageSize,
          action: actionParam,
          resource: resourceParam,
        },
        onError: (err: string) => toast.error(err),
      })

      if (success && result) {
        setLogs(result.logs)
        setPagination(prev => ({
          ...prev,
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
        }))
      }
    },
    [auditLogsApi, pageSize, actionParam, resourceParam]
  )

  // Fetch logs whenever URL params change (Source of Truth)
  useEffect(() => {
    fetchLogs(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, actionParam, resourceParam])

  const columns: Column<AuditLog>[] = [
    {
      key: 'time',
      label: t('time'),
      render: log => (
        <span className="whitespace-nowrap text-sm">{formatters.date(log.createdAt)}</span>
      ),
    },
    {
      key: 'user',
      label: t('user'),
      render: log => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {log.adminUser.name || log.adminUser.username}
          </span>
          <span className="text-xs text-base-content/60">{log.adminUser.email}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: t('action'),
      render: log => (
        <span
          className={`badge badge-sm ${getBadgeClassName(getAuditActionVariant(log.action))}`}
        >
          {log.action}
        </span>
      ),
    },
    {
      key: 'resource',
      label: t('resource'),
      render: log => (
        <div className="flex flex-col">
          <span className="text-sm">{log.resource}</span>
          {log.resourceId && (
            <span className="text-xs text-base-content/60">
              ID: {truncateId(log.resourceId)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      label: t('ip_address'),
      render: log => <span className="text-sm">{log.ipAddress || '-'}</span>,
    },
    {
      key: 'details',
      label: t('details'),
      render: log => (
        <span className="max-w-xs truncate text-sm italic opacity-70">{log.details || '-'}</span>
      ),
    },
  ]

  const pendingOption = CLEANUP_OPTIONS.find(o => o.days === pendingDays)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-base-content/70">{t('subtitle')}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => setCleanupModalOpen(true)}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {t('cleanup')}
        </Button>
      </div>

      {/* Cleanup period picker modal */}
      {cleanupModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="text-lg font-bold">{t('cleanup_title')}</h3>
            <p className="mt-1 mb-4 text-sm text-base-content/70">{t('cleanup_desc')}</p>
            <div className="flex flex-col gap-2">
              {CLEANUP_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  className="btn btn-outline btn-sm justify-start"
                  onClick={() => handleCleanupSelect(opt.days)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5 text-error" />
                  {t(opt.labelKey as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setCleanupModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setCleanupModalOpen(false)} />
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmModalOpen && pendingOption && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="text-lg font-bold text-error">{t('cleanup_title')}</h3>
            <p className="mt-2 text-sm">
              {t('cleanup_confirm', { period: t(pendingOption.labelKey as Parameters<typeof t>[0]) })}
            </p>
            <p className="mt-1 text-xs text-base-content/60">{t('cleanup_warning')}</p>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <Button
                variant="primary"
                size="sm"
                loading={isDeleting}
                onClick={handleConfirmDelete}
                className="btn-error"
              >
                {isDeleting ? t('deleting') : t('cleanup_title')}
              </Button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !isDeleting && setConfirmModalOpen(false)} />
        </div>
      )}

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder={t('filter_action')}
          className="input input-bordered w-full h-10"
          value={filters.action}
          onChange={e => updateFilterState('action', e.target.value)}
        />
        <input
          type="text"
          placeholder={t('filter_resource')}
          className="input input-bordered w-full h-10"
          value={filters.resource}
          onChange={e => updateFilterState('resource', e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        data={logs}
        loading={auditLogsApi.loading}
        emptyMessage={t('no_logs')}
        pagination={pagination}
        onPageChange={handlePageChange}
        getRowKey={log => log.id}
      />
    </div>
  )
}
