'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

import { useTranslations } from 'next-intl'
import { RoleFormModal } from '@/components/admin/role/RoleFormModal'
import { RolePermissionsModal } from '@/components/admin/role/RolePermissionsModal'
import { DeleteConfirmModal } from '@/components/admin/common/DeleteConfirmModal'
import { Edit, Shield, Trash2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { RoleWithCounts, RolesListResponse, RoleDetailResponse } from '@/types/admin'
import { useModalState } from '@/hooks/useModalState'

export default function RolesPage() {
  const t = useTranslations('admin.roles')
  const [roles, setRoles] = useState<RoleWithCounts[]>([])

  // Modal states using custom hook
  const formModal = useModalState<RoleWithCounts>()
  const permissionsModal = useModalState<RoleWithCounts>()
  const deleteModal = useModalState<RoleWithCounts>()

  // APIs
  const rolesApi = useApi<RolesListResponse>('/api/admin/roles', 'GET')
  const roleDetailApi = useApi<RoleDetailResponse>('', 'GET')
  const deleteRoleApi = useApi('', 'DELETE')

  const fetchRoles = async () => {
    const { success, data: result } = await rolesApi.request(undefined, {
      onError: (err: string) => toast.error(err),
    })

    if (success && result) {
      setRoles(result.roles)
    }
  }

  useEffect(() => {
    fetchRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateRole = () => {
    formModal.open()
  }

  const handleEditRole = (role: RoleWithCounts) => {
    formModal.open(role)
  }

  const handleManagePermissions = async (role: RoleWithCounts) => {
    const { success, result, data } = await roleDetailApi.request(undefined, {
      urlOverride: `/api/admin/roles/${role.id}`,
    })

    if (success && data) {
      permissionsModal.open(data.role)
    } else {
      toast.error(result?.message || 'Failed to fetch role details')
    }
  }

  const handleDeleteRole = (role: RoleWithCounts) => {
    deleteModal.open(role)
  }

  const confirmDelete = async () => {
    if (!deleteModal.selectedItem) return

    const { success } = await deleteRoleApi.request(undefined, {
      urlOverride: `/api/admin/roles/${deleteModal.selectedItem.id}`,
      onError: (err: string) => toast.error(err),
    })

    if (success) {
      toast.success(t('delete_success'))
      fetchRoles()
      deleteModal.close()
    }
  }

  const canDeleteRole = (role: RoleWithCounts) => {
    return !role.isDefault && role._count.adminUsers === 0
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Button onClick={handleCreateRole}>{t('create_role')}</Button>
      </div>

      {rolesApi.loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map(role => (
            <div key={role.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {role.name}
                  {role.isDefault && (
                    <span className="badge badge-secondary badge-sm">{t('default')}</span>
                  )}
                </h2>
                <p className="text-sm text-base-content/70">
                  {role.description || t('no_description')}
                </p>

                <div className="mt-4 flex gap-4 text-sm">
                  <div>
                    <span className="font-semibold">{role._count.adminUsers}</span> {t('users')}
                  </div>
                  <div>
                    <span className="font-semibold">{role._count.permissions}</span>{' '}
                    {t('permissions')}
                  </div>
                </div>

                <div className="card-actions mt-4 items-center justify-end gap-1">
                  <button
                    className="btn btn-ghost btn-sm size-7 p-0"
                    onClick={() => handleEditRole(role)}
                    title={t('edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm size-7 p-0"
                    onClick={() => handleManagePermissions(role)}
                    title={t('manage_permissions')}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <div className="flex items-center">
                    <button
                      className="btn btn-ghost btn-sm size-7 p-0 text-error disabled:opacity-50"
                      onClick={() => handleDeleteRole(role)}
                      disabled={!canDeleteRole(role)}
                      title={
                        !canDeleteRole(role)
                          ? role.isDefault
                            ? t('cannot_delete_default')
                            : t('cannot_delete_in_use')
                          : t('delete')
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!rolesApi.loading && roles.length === 0 && (
        <div className="py-12 text-center text-base-content/60">{t('no_roles')}</div>
      )}

      {/* Modals */}
      <RoleFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSuccess={fetchRoles}
        role={formModal.selectedItem}
      />

      <RolePermissionsModal
        isOpen={permissionsModal.isOpen}
        onClose={permissionsModal.close}
        onSuccess={fetchRoles}
        role={permissionsModal.selectedItem}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={confirmDelete}
        loading={deleteRoleApi.loading}
        title={t('delete_role')}
        message={t('delete_confirm', {
          name: deleteModal.selectedItem?.name || '',
        })}
        warning={t('delete_warning')}
      />
    </div>
  )
}
