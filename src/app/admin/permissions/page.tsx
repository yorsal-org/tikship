'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Edit, Trash2, Shield, LayoutGrid, Clock, Lock, Info } from 'lucide-react'
import { toast } from '@/lib/utils/toast'
import { Permission } from '@/types/admin'
import PermissionFormModal from '@/components/admin/permission/PermissionFormModal'
import { Table, Column } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'

type SortMode = 'group' | 'time'

export default function PermissionsPage() {
  const t = useTranslations('admin.permissions')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('time')

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/permissions')
      const result = await response.json()

      if (result.success && result.data) {
        setPermissions(result.data.permissions || [])
      } else {
        toast.error(result.error || 'Failed to fetch permissions')
      }
    } catch {
      toast.error('Failed to fetch permissions')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (permission: Permission) => {
    if (permission.isSystem) {
      toast.error(t('cannot_edit_system'))
      return
    }
    setEditingPermission(permission)
    setIsFormOpen(true)
  }

  const handleDelete = async (permission: Permission) => {
    if (permission.isSystem) {
      toast.error(t('cannot_delete_system'))
      return
    }

    if (!confirm(t('delete_confirm'))) {
      return
    }

    setDeletingId(permission.id)

    try {
      const response = await fetch(`/api/admin/permissions/${permission.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        toast.success(t('delete_success'))
        fetchPermissions()
      } else {
        toast.error(result.error || 'Failed to delete permission')
      }
    } catch {
      toast.error('Failed to delete permission')
    } finally {
      setDeletingId(null)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingPermission(null)
  }

  const handleFormSuccess = () => {
    fetchPermissions()
  }

  // Sort permissions based on current mode
  const sortedPermissions = [...permissions].sort((a, b) => {
    if (sortMode === 'time') {
      // Sort by createdAt, newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    // Default: sort by resource, then by action
    return a.resource.localeCompare(b.resource) || a.action.localeCompare(b.action)
  })

  // Group permissions by resource (only for group mode)
  const groupedPermissions: Array<{
    resource: string
    permissions: Permission[]
  }> = []

  if (sortMode === 'group') {
    const resourceMap = new Map<string, Permission[]>()
    sortedPermissions.forEach(permission => {
      if (!resourceMap.has(permission.resource)) {
        resourceMap.set(permission.resource, [])
        groupedPermissions.push({
          resource: permission.resource,
          permissions: resourceMap.get(permission.resource)!,
        })
      }
      resourceMap.get(permission.resource)!.push(permission)
    })
  }

  const getResourceIcon = (resource: string) => {
    // 根据资源类型返回不同的图标颜色
    const colors: Record<string, string> = {
      user: 'text-blue-500',
      role: 'text-purple-500',
      permission: 'text-green-500',
      product: 'text-orange-500',
      order: 'text-pink-500',
      post: 'text-indigo-500',
      admin: 'text-red-500',
    }
    return colors[resource] || 'text-gray-500'
  }

  const getActionBadgeColor = (action: string) => {
    // 根据操作类型返回不同的徽章颜色
    const colors: Record<string, string> = {
      view: 'badge-info',
      create: 'badge-success',
      update: 'badge-warning',
      delete: 'badge-error',
      manage: 'badge-primary',
    }
    return colors[action] || 'badge-neutral'
  }

  const renderPermissionCard = (permission: Permission) => {
    const [resource, action] = permission.code.split(':')

    return (
      <div
        key={permission.id}
        className={`border rounded-lg p-4 transition-all duration-200 ${
          permission.isSystem
            ? 'bg-base-100 border-info/30 hover:border-info/50 hover:shadow-md'
            : 'bg-base-100 border-base-300 hover:border-primary/50 hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Lock className={`w-4 h-4 shrink-0 ${getResourceIcon(resource)}`} />
              <span className="font-semibold text-base truncate">{permission.name}</span>
              {permission.isSystem && (
                <span className="badge badge-sm badge-info gap-1 shrink-0">
                  <Shield className="w-3 h-3" />
                  {t('system_permission')}
                </span>
              )}
            </div>

            {permission.description && (
              <div className="text-sm text-base-content/70 mb-2 line-clamp-2">
                {permission.description}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs bg-base-200 px-2 py-1 rounded text-base-content/80">
                {permission.code}
              </code>
              <span className={`badge badge-xs ${getActionBadgeColor(action)}`}>{action}</span>
            </div>
          </div>

          {!permission.isSystem && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleEdit(permission)}
                className="btn btn-ghost btn-sm btn-square hover:btn-primary"
                title={t('edit')}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(permission)}
                className="btn btn-ghost btn-sm btn-square hover:btn-error text-error"
                disabled={deletingId === permission.id}
                title={t('delete')}
              >
                {deletingId === permission.id ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 定义表格列
  const tableColumns: Column<Permission>[] = [
    {
      key: 'name',
      label: t('name'),
      render: (permission: Permission) => {
        const [resource] = permission.code.split(':')
        return (
          <div className="flex items-center gap-2">
            <Lock className={`w-4 h-4 shrink-0 ${getResourceIcon(resource)}`} />
            <div>
              <div className="font-semibold">{permission.name}</div>
              {permission.description && (
                <div className="text-xs text-base-content/60 mt-0.5">{permission.description}</div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'code',
      label: t('code'),
      render: (permission: Permission) => {
        const [, action] = permission.code.split(':')
        return (
          <div className="flex flex-col gap-1">
            <code className="text-xs bg-base-200 px-2 py-1 rounded text-base-content/80 inline-block">
              {permission.code}
            </code>
            <span className={`badge badge-xs ${getActionBadgeColor(action)} w-fit`}>{action}</span>
          </div>
        )
      },
    },
    {
      key: 'type',
      label: t('type'),
      render: (permission: Permission) => (
        <div>
          {permission.isSystem ? (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <StatusBadge
                status="system"
                variant="info"
                label={t('system_permission')}
                size="sm"
              />
            </div>
          ) : (
            <StatusBadge
              status="custom"
              variant="success"
              label={t('custom_permission')}
              size="sm"
            />
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: t('created_at'),
      render: (permission: Permission) => (
        <div className="text-sm text-base-content/70">
          {new Date(permission.createdAt).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (permission: Permission) => (
        <div className="flex gap-1">
          {!permission.isSystem ? (
            <>
              <button
                onClick={() => handleEdit(permission)}
                className="btn btn-ghost btn-sm btn-square hover:btn-primary"
                title={t('edit')}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(permission)}
                className="btn btn-ghost btn-sm btn-square hover:btn-error text-error"
                disabled={deletingId === permission.id}
                title={t('delete')}
              >
                {deletingId === permission.id ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            <span className="text-xs text-base-content/40 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {t('system_permission')}
            </span>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">{t('title')}</h1>
          <p className="mt-2 text-base-content/70">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <div className="join border border-base-content/20 rounded-lg">
            <button
              onClick={() => setSortMode('group')}
              className={`btn btn-sm btn-square join-item ${sortMode === 'group' ? 'btn-primary' : 'btn-ghost'}`}
              title={t('sort_by_group')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSortMode('time')}
              className={`btn btn-sm btn-square join-item ${sortMode === 'time' ? 'btn-primary' : 'btn-ghost'}`}
              title={t('sort_by_time')}
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" />
            {t('create_permission')}
          </button>
        </div>
      </div>

      {/* 信息提示卡片 */}
      <div className="alert alert-info shadow-lg">
        <Info className="w-5 h-5 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold">{t('info_title')}</h3>
          <div className="text-sm mt-1">
            {t('info_description')} <code className="bg-info/20 px-1 rounded">user:view</code>{' '}
            {t('info_example')}
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {!loading && permissions.length > 0 && (
        <div className="stats stats-vertical sm:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Shield className="w-8 h-8" />
            </div>
            <div className="stat-title">{t('stats_total')}</div>
            <div className="stat-value text-primary">{permissions.length}</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-info">
              <Lock className="w-8 h-8" />
            </div>
            <div className="stat-title">{t('stats_system')}</div>
            <div className="stat-value text-info">{permissions.filter(p => p.isSystem).length}</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-success">
              <Plus className="w-8 h-8" />
            </div>
            <div className="stat-title">{t('stats_custom')}</div>
            <div className="stat-value text-success">
              {permissions.filter(p => !p.isSystem).length}
            </div>
          </div>
        </div>
      )}

      {/* 权限列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">{t('loading')}</p>
        </div>
      ) : sortMode === 'group' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {groupedPermissions.map(({ resource, permissions: resourcePermissions }) => {
            const systemCount = resourcePermissions.filter(p => p.isSystem).length
            const customCount = resourcePermissions.filter(p => !p.isSystem).length

            return (
              <div
                key={resource}
                className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="card-title capitalize flex items-center gap-2">
                      <Lock className={`w-5 h-5 ${getResourceIcon(resource)}`} />
                      {resource.replace(/_/g, ' ')}
                    </h2>
                    <div className="badge badge-lg badge-outline">
                      {resourcePermissions.length} {t('items_count')}
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {systemCount > 0 && (
                      <span className="badge badge-info badge-sm gap-1">
                        <Shield className="w-3 h-3" />
                        {t('system_count')} {systemCount}
                      </span>
                    )}
                    {customCount > 0 && (
                      <span className="badge badge-success badge-sm whitespace-nowrap">
                        {t('custom_count')} {customCount}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">{resourcePermissions.map(renderPermissionCard)}</div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Table
          columns={tableColumns}
          data={sortedPermissions}
          loading={false}
          emptyMessage={t('no_permissions')}
          getRowKey={permission => permission.id}
          variant="card"
        />
      )}

      {!loading && permissions.length === 0 && (
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body items-center text-center py-16">
            <Shield className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-xl font-semibold text-base-content/60">{t('no_permissions')}</h3>
            <p className="text-base-content/50 mt-2">{t('empty_state')}</p>
          </div>
        </div>
      )}

      <PermissionFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        permission={editingPermission}
      />
    </div>
  )
}
