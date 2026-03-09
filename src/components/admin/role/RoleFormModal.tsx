'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useTranslations } from 'next-intl'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { validationConfig } from '@/config/validation'

interface RoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  role?: {
    id: string
    name: string
    description: string | null
    isDefault: boolean
  } | null
}

export function RoleFormModal({ isOpen, onClose, onSuccess, role }: RoleFormModalProps) {
  const t = useTranslations('admin.roles')

  const submitApi = useApi('', 'POST')

  const isEditMode = !!role

  // Initialize form data based on role prop
  const [formData, setFormData] = useState(() => {
    if (role) {
      return {
        name: role.name,
        description: role.description || '',
        isDefault: role.isDefault,
      }
    }
    return {
      name: '',
      description: '',
      isDefault: false,
    }
  })

  // Update form data when role changes using ref to track previous value
  const prevRoleIdRef = useRef(role?.id)
  useEffect(() => {
    if (role?.id !== prevRoleIdRef.current) {
      prevRoleIdRef.current = role?.id
      if (role) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          name: role.name,
          description: role.description || '',
          isDefault: role.isDefault,
        })
      } else {
        setFormData({
          name: '',
          description: '',
          isDefault: false,
        })
      }
    }
  }, [role?.id, role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = isEditMode ? `/api/admin/roles/${role.id}` : '/api/admin/roles'
    const method = isEditMode ? 'PUT' : 'POST'

    const { success } = await submitApi.request(
      { ...formData },
      {
        method,
        urlOverride: url,
        onError: (err: string) => toast.error(err),
      }
    )

    if (success) {
      toast.success(t(isEditMode ? 'update_success' : 'create_success'))
      onSuccess()
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('edit_role') : t('create_role')}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t('role_name')} <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-50">
              {formData.name.length}/{validationConfig.role.name.maxLength}
            </span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            minLength={validationConfig.role.name.minLength}
            maxLength={validationConfig.role.name.maxLength}
            required
            disabled={submitApi.loading}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('description')}</span>
            <span className="label-text-alt opacity-50">
              {formData.description.length}/{validationConfig.role.description.maxLength}
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full resize-none"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            maxLength={validationConfig.role.description.maxLength}
            disabled={submitApi.loading}
            rows={3}
            placeholder={t('description_placeholder')}
          />
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="checkbox"
              checked={formData.isDefault}
              onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
              disabled={submitApi.loading}
            />
            <span className="label-text">{t('is_default')}</span>
          </label>
          <p className="text-xs text-base-content/60 mt-1">{t('is_default_hint')}</p>
        </div>

        <div className="alert alert-info">
          <span className="text-sm">{t('permissions_hint')}</span>
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
            {isEditMode ? t('save') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
