'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { Permission } from '@/types/admin'
import { Modal } from '@/components/ui/Modal'
import { validationConfig } from '@/config/validation'

interface PermissionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  permission?: Permission | null
}

export default function PermissionFormModal({
  isOpen,
  onClose,
  onSuccess,
  permission,
}: PermissionFormModalProps) {
  const t = useTranslations('admin.permissions')
  const isEdit = !!permission

  const [formData, setFormData] = useState({
    code: permission?.code || '',
    name: permission?.name || '',
    description: permission?.description || '',
  })

  const [codeError, setCodeError] = useState('')

  const createApi = useApi('/api/admin/permissions', 'POST')
  const updateApi = useApi(permission ? `/api/admin/permissions/${permission.id}` : '', 'PATCH')

  const validateCode = (code: string): boolean => {
    const codePattern = /^[a-z_]+:[a-z_]+$/
    if (!codePattern.test(code)) {
      setCodeError(t('code_format_error'))
      return false
    }
    setCodeError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate code format (only for create mode)
    if (!isEdit && !validateCode(formData.code)) {
      return
    }

    // Extract resource and action from code
    const [resource, action] = formData.code.split(':')

    const api = isEdit ? updateApi : createApi
    const payload = isEdit
      ? {
          name: formData.name,
          description: formData.description,
          resource,
          action,
        }
      : {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          resource,
          action,
        }

    await api.request(payload, {
      onSuccess: () => {
        toast.success(t(isEdit ? 'update_success' : 'create_success'))
        onSuccess()
        onClose()
      },
      onError: (error: string) => toast.error(error),
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear code error when user types
    if (name === 'code' && codeError) {
      setCodeError('')
    }
  }

  const handleCodeBlur = () => {
    if (formData.code && !isEdit) {
      validateCode(formData.code)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(isEdit ? 'edit_permission' : 'create_permission')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Permission code description */}
        {!isEdit && (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div className="text-sm">
              <p className="font-semibold mb-1">{t('code_format_hint')}</p>
              <p>{t('code_placeholder')}</p>
            </div>
          </div>
        )}

        {/* Permission code */}
        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text font-semibold flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              {t('code')} <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-50">
              {formData.code.length}/{validationConfig.permission.code.maxLength}
            </span>
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            onBlur={handleCodeBlur}
            placeholder={t('code_placeholder')}
            className={`input input-bordered w-full ${codeError ? 'input-error' : ''} ${isEdit ? 'input-disabled' : ''}`}
            minLength={validationConfig.permission.code.minLength}
            maxLength={validationConfig.permission.code.maxLength}
            required
            disabled={isEdit}
          />
          {codeError && (
            <label className="label">
              <span className="label-text-alt text-error flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {codeError}
              </span>
            </label>
          )}
          {isEdit && (
            <label className="label">
              <span className="label-text-alt text-base-content/60 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                {t('code_readonly_hint')}
              </span>
            </label>
          )}
        </fieldset>

        {/* Permission name */}
        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text font-semibold flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {t('name')} <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-50">
              {formData.name.length}/{validationConfig.permission.name.maxLength}
            </span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('name_placeholder')}
            className="input input-bordered w-full"
            minLength={validationConfig.permission.name.minLength}
            maxLength={validationConfig.permission.name.maxLength}
            required
          />
        </fieldset>

        {/* Permission description */}
        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text font-semibold flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              {t('description')}
            </span>
            <span className="label-text-alt opacity-50">
              {formData.description.length}/{validationConfig.permission.description.maxLength}
            </span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('description_placeholder')}
            className="textarea textarea-bordered w-full"
            maxLength={validationConfig.permission.description.maxLength}
            rows={3}
          />
        </fieldset>

        {/* Action buttons */}
        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            disabled={createApi.loading || updateApi.loading}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary gap-2"
            disabled={createApi.loading || updateApi.loading}
          >
            {createApi.loading || updateApi.loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                {isEdit ? t('save') : t('create')}...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t(isEdit ? 'save' : 'create')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
