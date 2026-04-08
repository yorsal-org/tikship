'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useTranslations } from 'next-intl'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { checkPasswordStrength } from '@/lib/utils/validators'
import { useAdminSettings } from '@/hooks/useSettings'
import PasswordStrengthIndicator from '@/components/auth/register/PasswordStrengthIndicator'
import { Eye, EyeOff } from 'lucide-react'
import { validationConfig } from '@/config/validation'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
  userEmail: string
}

interface UserPasswordResponse {
  hasPassword: boolean
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  userEmail,
}: ChangePasswordModalProps) {
  const t = useTranslations('admin.members')
  const { admin } = useAdminSettings()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  const submitApi = useApi('', 'PUT')
  const checkPasswordApi = useApi<UserPasswordResponse>('', 'GET')

  const minStrength = admin.passwordMinStrength

  // Check if user has password when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      const checkPassword = async () => {
        const result = await checkPasswordApi.request(undefined, {
          urlOverride: `/api/admin/members/${userId}/password-status`,
        })
        if (result.success && 'data' in result) {
          setHasPassword(result.data.hasPassword)
        }
      }
      checkPassword()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('password_mismatch'))
      return
    }

    // Validate password strength
    const { isValid } = checkPasswordStrength(formData.newPassword, minStrength)
    if (!isValid) {
      toast.error(t('password_strength_error'))
      return
    }

    const { success } = await submitApi.request(
      { password: formData.newPassword },
      {
        urlOverride: `/api/admin/members/${userId}/password`,
        onError: (err: string) => toast.error(err),
      }
    )

    if (success) {
      toast.success(t('password_update_success'))
      setFormData({ newPassword: '', confirmPassword: '' })
      onSuccess()
      onClose()
    }
  }

  const handleClose = () => {
    setFormData({ newPassword: '', confirmPassword: '' })
    setHasPassword(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('change_password')} maxWidth="md">
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="alert alert-info">
          <span className="text-sm">{t('change_password_hint', { email: userEmail })}</span>
        </div>

        {hasPassword === false && (
          <div className="alert alert-warning">
            <span className="text-sm">{t('oauth_password_notice')}</span>
          </div>
        )}

        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text">
              {t('new_password')} <span className="text-error">*</span>
            </span>
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              className="input input-bordered w-full pr-10"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
              minLength={validationConfig.user.password.minLength}
              maxLength={validationConfig.user.password.maxLength}
              required
              disabled={submitApi.loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              tabIndex={-1}
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formData.newPassword && <PasswordStrengthIndicator password={formData.newPassword} />}
        </fieldset>

        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text">
              {t('confirm_password')} <span className="text-error">*</span>
            </span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="input input-bordered w-full pr-10"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              minLength={validationConfig.user.password.minLength}
              maxLength={validationConfig.user.password.maxLength}
              required
              disabled={submitApi.loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <label className="label">
              <span className="label-text-alt text-error">{t('password_mismatch')}</span>
            </label>
          )}
        </fieldset>

        <div className="modal-action">
          <Button
            type="button"
            onClick={handleClose}
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
