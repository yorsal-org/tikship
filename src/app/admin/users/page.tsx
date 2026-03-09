'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Table, Column } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { UserFormModal } from '@/components/admin/member/UserFormModal'
import { UserRolesModal } from '@/components/admin/member/UserRolesModal'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { useAdminAuth } from '@/components/providers/AdminAuthProvider'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { UserPlus, Search, Edit, Power, PowerOff, Shield, Trash2 } from 'lucide-react'
import { AdminUserWithRoles, AdminUsersListResponse } from '@/types/admin'
import { siteConfig } from '@/config/site'
import { useAdminPagination as usePagination } from '@/hooks/useAdminPagination'
import { useModalState } from '@/hooks/useModalState'
import { useDataFetch } from '@/hooks/useDataFetch'

export default function AdminUsersPage() {
  const t = useTranslations('admin.users')
  const router = useRouter()
  const {
    page: currentPage,
    search: searchParam,
    searchInput,
    setSearchInput,
    handlePageChange,
    pageSize,
  } = usePagination({ pageSize: siteConfig.admin.pageSize })

  const { handleSuccess, handleError } = useDataFetch()
  const { adminUser: currentUser } = useAdminAuth()
  const [users, setUsers] = useState<AdminUserWithRoles[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: siteConfig.admin.pageSize,
    total: 0,
    totalPages: 0,
  })

  // Modal states using custom hook
  const formModal = useModalState<AdminUserWithRoles>()
  const rolesModal = useModalState<AdminUserWithRoles>()
  const deleteModal = useModalState<AdminUserWithRoles>()

  // APIs
  const usersApi = useApi<AdminUsersListResponse>('/api/admin/users', 'GET')
  const deleteUserApi = useApi('', 'DELETE')
  const updateUserApi = useApi('', 'PUT')

  const fetchUsers = useCallback(
    async (page: number) => {
      const { success, data: result } = await usersApi.request(undefined, {
        params: {
          search: searchParam || undefined,
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
    [usersApi, searchParam, pageSize]
  )

  // Fetch users whenever URL params change (Source of Truth)
  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers(currentPage)
    }
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchParam, pageSize])

  const handleCreateUser = () => {
    formModal.open()
  }

  const handleEditUser = (user: AdminUserWithRoles) => {
    formModal.open(user)
  }

  const handleRolesClick = (user: AdminUserWithRoles) => {
    rolesModal.open(user)
  }

  const handleDeleteClick = (user: AdminUserWithRoles) => {
    deleteModal.open(user)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.selectedItem) return

    const { success } = await deleteUserApi.request(undefined, {
      urlOverride: `/api/admin/users/${deleteModal.selectedItem.id}`,
      onError: handleError,
    })

    if (success) {
      await handleSuccess(t('delete_success'), () => fetchUsers(currentPage))
      deleteModal.close()
    }
  }

  const handleToggleStatus = async (user: AdminUserWithRoles) => {
    // Prevent deactivating superusers
    if (user.isSuperuser && user.isActive) {
      handleError(t('superuser_cannot_deactivate'))
      return
    }

    const { success } = await updateUserApi.request(
      {
        isActive: !user.isActive,
      },
      {
        urlOverride: `/api/admin/users/${user.id}`,
        onError: handleError,
      }
    )

    if (success) {
      await handleSuccess(t('status_updated'), () => fetchUsers(currentPage))
    }
  }

  const columns: Column<AdminUserWithRoles>[] = [
    {
      key: 'username',
      label: t('username'),
      render: user => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{user.username}</span>
          {user.isSuperuser && (
            <span className="badge badge-primary badge-sm">{t('superuser')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: t('email'),
      render: user => <span className="text-sm">{user.email}</span>,
    },
    {
      key: 'name',
      label: t('name'),
      render: user => <span className="text-sm">{user.name || '-'}</span>,
    },
    {
      key: 'roles',
      label: t('roles'),
      render: user => (
        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
          {user.roles.map(ur => (
            <span key={ur.role.id} className="badge badge-outline badge-sm whitespace-nowrap">
              {ur.role.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('status'),
      render: user => (
        <StatusBadge
          status={user.isActive ? 'active' : 'inactive'}
          variant={user.isActive ? 'success' : 'error'}
          label={t(user.isActive ? 'active' : 'inactive')}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: user => (
        <div className="flex gap-1">
          {(!user.isSuperuser || user.id === currentUser?.id) && (
            <button
              onClick={() => handleEditUser(user)}
              className="btn btn-ghost btn-sm btn-square"
              title={t('edit')}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleToggleStatus(user)}
            disabled={user.isSuperuser || user.id === currentUser?.id}
            className={`btn btn-ghost btn-sm btn-square ${user.isActive ? 'text-warning' : 'text-success'}`}
            title={t(user.isActive ? 'deactivate' : 'activate')}
          >
            {user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </button>
          {(!user.isSuperuser || user.id === currentUser?.id) && (
            <button
              onClick={() => handleRolesClick(user)}
              className="btn btn-ghost btn-sm btn-square"
              title={t('manage_roles')}
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDeleteClick(user)}
            disabled={user.isSuperuser || user.id === currentUser?.id}
            className="btn btn-ghost btn-sm btn-square text-error disabled:text-base-content/30"
            title={
              user.isSuperuser
                ? t('superuser_cannot_delete')
                : user.id === currentUser?.id
                  ? t('cannot_delete_self')
                  : t('delete')
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button onClick={handleCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('create_user')}
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute z-1 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
        <input
          type="text"
          placeholder={t('search_placeholder')}
          className="input input-bordered w-full pl-10 h-10"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        data={users}
        loading={usersApi.loading}
        emptyMessage={t('no_users')}
        pagination={pagination}
        onPageChange={handlePageChange}
        getRowKey={user => user.id}
        variant="plain"
      />

      <UserFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSuccess={() => {
          router.refresh()
          fetchUsers(currentPage)
        }}
        user={formModal.selectedItem}
      />

      <UserRolesModal
        isOpen={rolesModal.isOpen}
        onClose={rolesModal.close}
        onSuccess={() => {
          router.refresh()
          fetchUsers(currentPage)
        }}
        user={rolesModal.selectedItem}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDeleteConfirm}
        loading={deleteUserApi.loading}
        title={t('delete_user')}
        message={t('delete_confirm', {
          username: deleteModal.selectedItem?.username || '',
        })}
        warning={t('delete_warning')}
      />
    </div>
  )
}
