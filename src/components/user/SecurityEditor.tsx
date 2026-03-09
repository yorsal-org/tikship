'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { KeyRound, CheckCircle2, Info, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/lib/utils/toast'
import PasswordStrengthIndicator from '@/components/auth/register/PasswordStrengthIndicator'
import { useApi } from '@/hooks/useApi'
import { validatePasswordStrength } from '@/lib/utils/validators'
import { siteConfig } from '@/config/site'

interface UserMeResponse {
  hasPassword: boolean
}

export default function SecurityEditor() {
  const t = useTranslations('user_profile')
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const userApi = useApi<UserMeResponse>('/api/user/me', 'GET')
  const passwordApi = useApi('/api/user/password', 'PATCH')

  useEffect(() => {
    const fetchUser = async () => {
      const { success, data } = await userApi.request()
      if (success && data?.hasPassword !== undefined) {
        setHasPassword(data.hasPassword)
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const minStrength = siteConfig.auth.password.minStrength as 'weak' | 'medium' | 'strong'
  const strengthResult = validatePasswordStrength(newPassword)
  const strengthWeight: Record<string, number> = {
    none: 0,
    weak: 1,
    medium: 2,
    strong: 3,
  }
  const isStrengthMet = strengthWeight[strengthResult.level] >= strengthWeight[minStrength]

  const handleSave = async () => {
    if ((hasPassword && !currentPassword) || !newPassword || !confirmPassword) {
      toast.error(t('update_error'))
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('password_update_error'))
      return
    }

    if (!isStrengthMet) {
      toast.error(t('update_error')) // Should use error_password_strength if available
      return
    }

    const { success, error } = await passwordApi.request({
      ...(hasPassword && { currentPassword }),
      newPassword,
    })

    if (success) {
      toast.success(t('password_update_success'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setHasPassword(true) // User now has a password
    } else {
      toast.error(error || t('password_update_error'))
    }
  }

  const isFormValid =
    (!hasPassword || currentPassword) &&
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword &&
    isStrengthMet &&
    !passwordApi.loading

  return (
    <div className="space-y-6">
      {!hasPassword && (
        <div className="alert alert-info py-4 shadow-sm border-none bg-info/10 text-info max-w-2xl">
          <Info className="w-5 h-5 shrink-0" />
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-sm leading-none">{t('oauth_password_title')}</h3>
            <p className="text-xs opacity-90 leading-relaxed">{t('oauth_password_hint')}</p>
          </div>
        </div>
      )}

      <div className="max-w-md space-y-4">
        {hasPassword && (
          <Input
            label={t('current_password_label')}
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            disabled={passwordApi.loading}
            leftIcon={<KeyRound className="w-4 h-4 opacity-40" />}
            rightIcon={
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4 opacity-40" />
                ) : (
                  <Eye className="w-4 h-4 opacity-40" />
                )}
              </button>
            }
          />
        )}

        <div>
          <Input
            label={hasPassword ? t('new_password_label') : t('confirm_password_label')}
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••"
            disabled={passwordApi.loading}
            leftIcon={<KeyRound className="w-4 h-4 opacity-40" />}
            rightIcon={
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4 opacity-40" />
                ) : (
                  <Eye className="w-4 h-4 opacity-40" />
                )}
              </button>
            }
          />
          <PasswordStrengthIndicator password={newPassword} />
        </div>

        <Input
          label={t('confirm_password_label')}
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          disabled={passwordApi.loading}
          leftIcon={<KeyRound className="w-4 h-4 opacity-40" />}
          rightIcon={
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4 opacity-40" />
              ) : (
                <Eye className="w-4 h-4 opacity-40" />
              )}
            </button>
          }
        />

        <div className="pt-4 flex flex-col gap-4">
          <Button
            onClick={handleSave}
            loading={passwordApi.loading}
            disabled={!isFormValid}
            variant="primary"
            className="w-full sm:w-auto"
            leftIcon={!passwordApi.loading && <CheckCircle2 className="w-4 h-4" />}
          >
            {hasPassword ? t('save_changes') : t('oauth_password_title')}
          </Button>
        </div>
      </div>
    </div>
  )
}
