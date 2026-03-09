'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { siteConfig } from '@/config/site'
import { Member, MemberStats as MemberStatsType, MembersListResponse } from '@/types/admin'
import Image from 'next/image'
import { useAdminPagination as usePagination } from '@/hooks/useAdminPagination'
import { useModalState } from '@/hooks/useModalState'
import { useDataFetch } from '@/hooks/useDataFetch'
import { formatters } from '@/lib/utils/formatters'

export default function AdminMembersPage() {
  const t = useTranslations('admin.members')
  const {
    page: currentPage,
    search: searchParam,
    searchInput,
    setSearchInput,
    handlePageChange,
    handleFilterChange: syncFilters,
    getParam,
    pageSize,
  } = usePagination({ pageSize: siteConfig.admin.pageSize })

  const statusParam = getParam('status')

  const { handleSuccess, handleError } = useDataFetch()
  const [users, setUsers] = useState<Member[]>([])
  const [stats, setStats] = useState<MemberStatsType | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: siteConfig.admin.pageSize,
    total: 0,
    totalPages: 0,
  })

  // APIs
  const membersApi = useApi<MembersListResponse>('/api/admin/members', 'GET')
  const statsApi = useApi<MemberStatsType>('/api/admin/members/stats', 'GET')
  const updateMemberApi = useApi('', 'PUT')
  const deleteMemberApi = useApi('', 'DELETE')

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
        setUsers(result.users)
        setPagination(prev => ({
          ...prev,
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
        }))
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

  const columns: Column<Member>[] = [
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
            onClick={() => {
              deleteModal.open(user)
            }}
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

      <Table
        columns={columns}
        data={users}
        loading={membersApi.loading}
        emptyMessage={t('no_users')}
        pagination={pagination}
        onPageChange={handlePageChange}
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
    </div>
  )
}
