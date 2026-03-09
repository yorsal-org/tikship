'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useTranslations } from 'next-intl'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { Role, RolesListResponse } from '@/types/admin'

interface UserRolesModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: {
    id: string
    username: string
    roles: Array<{ role: { id: string; name: string } }>
  } | null
}

export function UserRolesModal({ isOpen, onClose, onSuccess, user }: UserRolesModalProps) {
  const t = useTranslations('admin.users')
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  const rolesApi = useApi<RolesListResponse>('/api/admin/roles', 'GET')
  const submitApi = useApi('', 'POST')

  const fetchRoles = async () => {
    const { success, data: result } = await rolesApi.request(undefined)

    if (success && result) {
      setRoles(result.roles)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchRoles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (user) {
      setSelectedRoleIds(user.roles.map(r => r.role.id) || [])
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const { success } = await submitApi.request(
      { roleIds: selectedRoleIds },
      {
        urlOverride: `/api/admin/users/${user.id}/roles`,
        onError: (err: string) => toast.error(err),
      }
    )

    if (success) {
      toast.success(t('roles_updated'))
      onSuccess()
      onClose()
    }
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    )
  }

  if (!user) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('manage_roles')} - ${user.username}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="form-control">
          <div className="border rounded-lg p-2 max-h-80 overflow-y-auto">
            <div className="space-y-1">
              {roles.map(role => (
                <label
                  key={role.id}
                  className="flex items-start gap-3 p-2 rounded hover:bg-base-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm mt-0.5 shrink-0"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    disabled={submitApi.loading}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{role.name}</div>
                    {role.description && (
                      <div className="text-xs text-base-content/60 mt-0.5">{role.description}</div>
                    )}
                    {role.isDefault && (
                      <span className="badge badge-sm badge-primary mt-1">{t('default_role')}</span>
                    )}
                  </div>
                </label>
              ))}
              {roles.length === 0 && (
                <p className="text-sm text-base-content/60 text-center py-4">{t('no_roles')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-action">
          <Button
            type="button"
            onClick={onClose}
            disabled={submitApi.loading}
            className="btn-ghost"
          >
            {t('cancel')}
          </Button>
          <Button type="submit" loading={submitApi.loading} disabled={submitApi.loading}>
            {t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
