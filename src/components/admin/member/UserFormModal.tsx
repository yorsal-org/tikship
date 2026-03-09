'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useTranslations } from 'next-intl'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { checkPasswordStrength } from '@/lib/utils/validators'
import { siteConfig } from '@/config/site'
import PasswordStrengthIndicator from '@/components/auth/register/PasswordStrengthIndicator'
import { Eye, EyeOff } from 'lucide-react'
import { validationConfig } from '@/config/validation'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: {
    id: string
    username: string
    email: string
    name: string | null
    isSuperuser: boolean
    isActive: boolean
    roles?: Array<{ role: { id: string; name: string } }>
  } | null
}

export function UserFormModal({ isOpen, onClose, onSuccess, user }: UserFormModalProps) {
  const t = useTranslations('admin.users')
  const [formData, setFormData] = useState(() => {
    if (user) {
      return {
        username: user.username,
        email: user.email,
        password: '',
        name: user.name || '',
        isActive: user.isActive,
      }
    }
    return {
      username: '',
      email: '',
      password: '',
      name: '',
      isActive: true,
    }
  })
  const [showPassword, setShowPassword] = useState(false)

  const submitApi = useApi('', 'POST')

  const isEditMode = !!user
  const minStrength = siteConfig.admin.password.minStrength as 'weak' | 'medium' | 'strong'

  // Update form data when user changes using ref to track previous value
  const prevUserIdRef = useRef(user?.id)
  useEffect(() => {
    if (user?.id !== prevUserIdRef.current) {
      prevUserIdRef.current = user?.id
      if (user) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          username: user.username,
          email: user.email,
          password: '',
          name: user.name || '',
          isActive: user.isActive,
        })
      } else {
        setFormData({
          username: '',
          email: '',
          password: '',
          name: '',
          isActive: true,
        })
      }
    }
  }, [user?.id, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password strength if password is provided
    if ((!isEditMode || formData.password) && formData.password) {
      const { isValid } = checkPasswordStrength(formData.password, minStrength)

      if (!isValid) {
        toast.error(t('password_strength_error'))
        return
      }
    }

    const url = isEditMode ? `/api/admin/users/${user.id}` : '/api/admin/users'
    const method = isEditMode ? 'PUT' : 'POST'

    const body: {
      username: string
      email: string
      name: string | null
      isActive: boolean
      password?: string
    } = {
      username: formData.username,
      email: formData.email,
      name: formData.name || null,
      isActive: formData.isActive,
    }

    if (!isEditMode || formData.password) {
      body.password = formData.password
    }

    const { success } = await submitApi.request(body, {
      method,
      urlOverride: url,
      onError: (err: string) => toast.error(err),
    })

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
      title={isEditMode ? t('edit_user') : t('create_user')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t('username')} <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-50">
              {formData.username.length}/{validationConfig.user.username.maxLength}
            </span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            minLength={validationConfig.user.username.minLength}
            maxLength={validationConfig.user.username.maxLength}
            required
            disabled={submitApi.loading}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t('email')} <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-50">
              {formData.email.length}/{validationConfig.user.email.maxLength}
            </span>
          </label>
          <input
            type="email"
            className="input input-bordered w-full"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            minLength={validationConfig.user.email.minLength}
            maxLength={validationConfig.user.email.maxLength}
            required
            disabled={submitApi.loading}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t('password')} {!isEditMode && <span className="text-error">*</span>}
            </span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={e => {
                setFormData({ ...formData, password: e.target.value })
              }}
              minLength={validationConfig.user.password.minLength}
              maxLength={validationConfig.user.password.maxLength}
              required={!isEditMode}
              disabled={submitApi.loading}
              placeholder={isEditMode ? t('password_placeholder') : ''}
              className="input input-bordered w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formData.password && <PasswordStrengthIndicator password={formData.password} />}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('name')}</span>
            <span className="label-text-alt opacity-50">
              {formData.name.length}/{validationConfig.user.name.maxLength}
            </span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            maxLength={validationConfig.user.name.maxLength}
            disabled={submitApi.loading}
          />
        </div>

        {!user?.isSuperuser && (
          <>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={submitApi.loading}
                />
                <span className="label-text">{t('is_active')}</span>
              </label>
            </div>
          </>
        )}

        {user?.isSuperuser && (
          <p className="text-sm text-warning">{t('superuser_cannot_edit_roles')}</p>
        )}

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
