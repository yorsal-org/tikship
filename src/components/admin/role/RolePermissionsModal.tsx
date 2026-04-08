'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useTranslations } from 'next-intl'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { Permission, PermissionsListResponse } from '@/types/admin'

interface RolePermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  role: {
    id: string
    name: string
    permissions?: Array<{ permission: Permission }>
  } | null
}

export function RolePermissionsModal({
  isOpen,
  onClose,
  onSuccess,
  role,
}: RolePermissionsModalProps) {
  const t = useTranslations('admin.roles')
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const permissionsApi = useApi<PermissionsListResponse>('/api/admin/permissions', 'GET')
  const updatePermissionsApi = useApi('', 'PUT')

  const fetchPermissions = async () => {
    const result = await permissionsApi.request(undefined)

    if (result.success && 'data' in result) {
      setAllPermissions(result.data.permissions)
    }
  }

  useEffect(() => {
    if (isOpen && role) {
      fetchPermissions()
      setSelectedPermissions(role.permissions?.map(p => p.permission.id) || [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    const { success } = await updatePermissionsApi.request(
      { permissionIds: selectedPermissions },
      {
        urlOverride: `/api/admin/roles/${role.id}/permissions`,
        onError: (err: string) => toast.error(err),
      }
    )

    if (success) {
      toast.success(t('permissions_updated'))
      onSuccess()
      onClose()
    }
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId) ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
    )
  }

  // Group permissions by resource while maintaining order
  const groupedPermissions: Array<{
    resource: string
    permissions: Permission[]
  }> = []
  const resourceMap = new Map<string, Permission[]>()

  allPermissions.forEach(permission => {
    if (!resourceMap.has(permission.resource)) {
      resourceMap.set(permission.resource, [])
      groupedPermissions.push({
        resource: permission.resource,
        permissions: resourceMap.get(permission.resource)!,
      })
    }
    resourceMap.get(permission.resource)!.push(permission)
  })

  if (!role) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('manage_permissions')}: ${role.name}`}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="max-h-128 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedPermissions.map(({ resource, permissions }) => (
              <div key={resource} className="border rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 capitalize sticky top-0 bg-base-100 pb-1">
                  {resource.replace(/_/g, ' ')}
                </h4>
                <div className="space-y-1">
                  {permissions.map(permission => (
                    <label
                      key={permission.id}
                      className="flex items-start gap-2 cursor-pointer hover:bg-base-200 rounded p-1"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mt-0.5 shrink-0"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        disabled={permissionsApi.loading || updatePermissionsApi.loading}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{permission.name}</div>
                        {permission.description && (
                          <div className="text-xs text-base-content/60 line-clamp-2">
                            {permission.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-action">
          <Button
            type="button"
            onClick={onClose}
            disabled={updatePermissionsApi.loading}
            className="btn-ghost"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            loading={updatePermissionsApi.loading}
            disabled={updatePermissionsApi.loading}
          >
            {t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
