'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Table, Column } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MemberStats } from '@/components/admin/member/MemberStats'
import { MemberDetailsModal } from '@/components/admin/member/MemberDetailsModal'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { ChangePasswordModal } from '@/components/admin/member/ChangePasswordModal'
import { Users, Search, Eye, KeyRound, Power, PowerOff, Trash2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { Member, MemberStats as MemberStatsType, MembersListResponse } from '@/types/admin'
import Image from 'next/image'
import { useAdminPagination as usePagination } from '@/hooks/useAdminPagination'
import { useModalState } from '@/hooks/useModalState'
import { useDataFetch } from '@/hooks/useDataFetch'
import { formatters } from '@/lib/utils/formatters'

type MemberBulkAction = 'activate' | 'deactivate' | 'delete'

export default function AdminMembersPage() {
  const t = useTranslations('admin.members')
  const {
    page: currentPage,
    search: searchParam,
    searchInput,
    setSearchInput,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange: syncFilters,
    getParam,
    pageSize,
  } = usePagination()

  const statusParam = getParam('status')

  const { handleSuccess, handleError } = useDataFetch()
  const [users, setUsers] = useState<Member[]>([])
  const [stats, setStats] = useState<MemberStatsType | null>(null)
  const [pagination, setPagination] = useState({})

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Bulk action confirm modal
  const [pendingBulkAction, setPendingBulkAction] = useState<MemberBulkAction | null>(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // APIs
  const membersApi = useApi<MembersListResponse>('/api/admin/members', 'GET')
  const statsApi = useApi<MemberStatsType>('/api/admin/members/stats', 'GET')
  const updateMemberApi = useApi('', 'PUT')
  const deleteMemberApi = useApi('', 'DELETE')
  const bulkMembersApi = useApi<{ count: number }>('/api/admin/members', 'PUT')

  // Modals using custom hook
  const detailsModal = useModalState<Member>()
  const deleteModal = useModalState<Member>()
  const passwordModal = useModalState<Member>()

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      const { success, data } = await statsApi.request(undefined)
      if (success && data) {
        setStats(data)
      }
    }
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUsers = useCallback(
    async (page: number) => {
      const { success, data: result } = await membersApi.request(undefined, {
        params: {
          search: searchParam,
          status: statusParam || undefined,
          page,
          pageSize,
        },
        onError: (err: string) => toast.error(err),
      })

      if (success && result) {
        const nextUsers = result.users
        setUsers(nextUsers)
        setSelectedIds(current => current.filter(id => nextUsers.some(u => u.id === id)))
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        })
      }
    },
    [membersApi, searchParam, statusParam, pageSize]
  )

  useEffect(() => {
    fetchUsers(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchParam, statusParam, pageSize])

  const handleToggleStatus = async (user: Member) => {
    const { success } = await updateMemberApi.request(
      { isActive: !user.isActive },
      {
        urlOverride: `/api/admin/members/${user.id}`,
        onError: handleError,
      }
    )

    if (success) {
      await handleSuccess(t('status_updated'), () => fetchUsers(currentPage))
    }
  }

  const handleStatusFilterChange = (value: string) => {
    syncFilters({ status: value })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.selectedItem) return
    const { success } = await deleteMemberApi.request(undefined, {
      urlOverride: `/api/admin/members/${deleteModal.selectedItem.id}`,
      onError: handleError,
    })

    if (success) {
      await handleSuccess(t('delete_success'), () => fetchUsers(currentPage))
      deleteModal.close()
    }
  }

  const openDetails = (user: Member) => {
    detailsModal.open(user)
  }

  // --- Bulk selection ---
  const allSelected = users.length > 0 && selectedIds.length === users.length
  const selectedCount = selectedIds.length

  const selectedUsers = useMemo(
    () => users.filter(u => selectedIds.includes(u.id)),
    [users, selectedIds]
  )

  const hasActiveSelection = selectedUsers.some(u => u.isActive)
  const hasInactiveSelection = selectedUsers.some(u => !u.isActive)

  const handleToggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : users.map(u => u.id))
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(current =>
      current.includes(id) ? current.filter(i => i !== id) : [...current, id]
    )
  }

  const requestBulkAction = (action: MemberBulkAction) => {
    setPendingBulkAction(action)
    setIsBulkModalOpen(true)
  }

  const resetBulkState = () => {
    setPendingBulkAction(null)
    setIsBulkModalOpen(false)
  }

  const handleBulkConfirm = async () => {
    if (!pendingBulkAction) return
    const { success, data } = await bulkMembersApi.request(
      { ids: selectedIds, action: pendingBulkAction },
      { onError: handleError }
    )
    if (success) {
      const count = data?.count ?? selectedIds.length
      toast.success(
        t(pendingBulkAction === 'delete' ? 'bulk_delete_success' : 'bulk_status_updated', { count })
      )
      setSelectedIds([])
      resetBulkState()
      await fetchUsers(currentPage)
    }
  }

  const bulkActionOptions = useMemo(() => {
    const options: { value: MemberBulkAction; label: string }[] = []
    if (hasInactiveSelection) options.push({ value: 'activate', label: t('bulk_activate') })
    if (hasActiveSelection) options.push({ value: 'deactivate', label: t('bulk_deactivate') })

    // Only show delete if all selected members are inactive
    const allInactive = selectedUsers.every(u => !u.isActive)
    if (allInactive && selectedCount > 0) {
      options.push({ value: 'delete', label: t('bulk_delete') })
    }

    return options
  }, [hasActiveSelection, hasInactiveSelection, selectedUsers, selectedCount, t])

  const getBulkModalMessage = () => {
    if (!pendingBulkAction) return ''
    if (pendingBulkAction === 'activate')
      return t('bulk_activate_confirm', { count: selectedCount })
    if (pendingBulkAction === 'deactivate')
      return t('bulk_deactivate_confirm', { count: selectedCount })
    return t('bulk_delete_confirm', { count: selectedCount })
  }

  const columns: Column<Member>[] = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={allSelected}
          onChange={handleToggleSelectAll}
          aria-label={t('select_all')}
        />
      ),
      className: 'w-12',
      render: user => (
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={selectedIds.includes(user.id)}
          onChange={() => handleToggleSelect(user.id)}
          aria-label={t('select_item', { name: user.email || user.name || '' })}
        />
      ),
    },
    {
      key: 'name',
      label: t('name'),
      render: user => (
        <div className="flex items-center gap-2">
          <div className="avatar">
            <div className="h-8 w-8 relative overflow-hidden rounded-full bg-base-300">
              {user.image ? (
                <Image src={user.image} alt={user.name || ''} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-base-content/30">
                  <Users size={14} />
                </div>
              )}
            </div>
          </div>
          <span className="text-sm">{user.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: t('email'),
      render: user => <span className="text-sm">{user.email}</span>,
    },
    {
      key: 'status',
      label: t('status'),
      render: user => (
        <button onClick={() => handleToggleStatus(user)} className="btn btn-ghost btn-xs">
          <StatusBadge
            status={user.isActive ? 'active' : 'inactive'}
            variant={user.isActive ? 'success' : 'error'}
            label={t(user.isActive ? 'active' : 'inactive')}
            size="sm"
          />
        </button>
      ),
    },
    {
      key: 'joinedAt',
      label: t('joined_at'),
      render: user => <span className="text-sm">{formatters.dateShort(user.createdAt)}</span>,
    },
    {
      key: 'lastLogin',
      label: t('last_login'),
      render: user => (
        <span className="text-sm">
          {user.lastLoginAt ? formatters.date(user.lastLoginAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: user => (
        <div className="flex gap-1">
          <button
            onClick={() => openDetails(user)}
            className="btn btn-ghost btn-sm btn-square"
            title={t('details')}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => passwordModal.open(user)}
            className="btn btn-ghost btn-sm btn-square text-info"
            title={t('change_password')}
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(user)}
            className={`btn btn-ghost btn-sm btn-square ${user.isActive ? 'text-warning' : 'text-success'}`}
            title={t(user.isActive ? 'deactivate' : 'activate')}
          >
            {user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </button>
          <button
            onClick={() => deleteModal.open(user)}
            className="btn btn-ghost btn-sm btn-square text-error"
            title={t('delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <MemberStats stats={stats} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute z-1 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            className="input input-bordered w-full pl-10 h-10"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <select
          value={statusParam || ''}
          onChange={e => handleStatusFilterChange(e.target.value)}
          className="select select-bordered w-40 h-10 min-h-0"
        >
          <option value="">{t('all_status')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
      </div>

      {selectedCount > 0 && (
        <div className="alert bg-base-200 border border-base-300 flex flex-wrap items-center gap-3">
          <span className="font-medium">{t('selected_count', { count: selectedCount })}</span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {bulkActionOptions.map(option => (
              <button
                key={option.value}
                className={`btn btn-sm${option.value === 'delete' ? ' btn-error btn-outline' : ''}`}
                onClick={() => requestBulkAction(option.value)}
                disabled={bulkMembersApi.loading}
              >
                {option.label}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])}>
              {t('clear_selection')}
            </button>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={users}
        loading={membersApi.loading}
        emptyMessage={t('no_users')}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowKey={user => user.id}
      />

      {detailsModal.isOpen && (
        <MemberDetailsModal
          isOpen={detailsModal.isOpen}
          onClose={detailsModal.close}
          userId={detailsModal.selectedItem?.id || ''}
        />
      )}

      {passwordModal.isOpen && passwordModal.selectedItem && (
        <ChangePasswordModal
          isOpen={passwordModal.isOpen}
          onClose={passwordModal.close}
          onSuccess={() => fetchUsers(currentPage)}
          userId={passwordModal.selectedItem.id}
          userEmail={passwordModal.selectedItem.email as string}
        />
      )}

      {/* Single delete confirm */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDeleteConfirm}
        loading={deleteMemberApi.loading}
        title={t('delete')}
        message={t('delete_confirm', {
          name: deleteModal.selectedItem?.email || deleteModal.selectedItem?.name || '',
        })}
        warning={t('delete_warning')}
      />

      {/* Bulk action confirm */}
      <DeleteConfirmModal
        isOpen={isBulkModalOpen}
        onClose={resetBulkState}
        onConfirm={handleBulkConfirm}
        loading={bulkMembersApi.loading}
        title={
          pendingBulkAction === 'delete'
            ? t('bulk_delete')
            : pendingBulkAction === 'activate'
              ? t('bulk_activate')
              : t('bulk_deactivate')
        }
        message={getBulkModalMessage()}
        warning={pendingBulkAction === 'delete' ? t('delete_warning') : undefined}
        confirmText={
          pendingBulkAction === 'delete'
            ? t('bulk_delete')
            : pendingBulkAction === 'activate'
              ? t('bulk_activate')
              : t('bulk_deactivate')
        }
      />
    </div>
  )
}
