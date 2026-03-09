'use client'

import { useState } from 'react'
import { User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import PasswordStrengthIndicator from '@/components/auth/register/PasswordStrengthIndicator'
import AvatarUpload from '@/components/auth/register/AvatarUpload'
import { validateName, validatePasswordStrength } from '@/lib/utils/validators'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { useApi } from '@/hooks/useApi'
import { siteConfig } from '@/config/site'

interface StepUserInfoProps {
  email: string
  token: string
  onNext: () => void
}

export default function StepUserInfo({ email, token, onNext }: StepUserInfoProps) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const t = useTranslations('register')

  const completeApi = useApi('/api/auth/register/complete')

  const minStrength = siteConfig.auth.password.minStrength as 'weak' | 'medium' | 'strong'
  const passwordResult = validatePasswordStrength(password)
  const strengthWeight: Record<string, number> = {
    none: 0,
    weak: 1,
    medium: 2,
    strong: 3,
  }
  const isPasswordStrongEnough = strengthWeight[passwordResult.level] >= strengthWeight[minStrength]

  const handleSubmit = async () => {
    // Validate name
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      let messageKey = 'error_name_length'
      if (nameValidation.error === 'NAME_EMPTY') {
        messageKey = 'error_name_empty'
      } else if (nameValidation.error === 'NAME_INVALID_CHARACTERS') {
        messageKey = 'error_name_invalid'
      }
      completeApi.setError(t(messageKey))
      return
    }

    // Double check password strength
    if (!isPasswordStrongEnough) {
      completeApi.setError(t('error_password_strength'))
      return
    }

    const { success } = await completeApi.request({
      token,
      name: name.trim(),
      password,
      avatarUrl,
    })

    if (success) {
      onNext()
    }
  }

  const isFormValid =
    name &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    isPasswordStrongEnough &&
    !completeApi.loading

  return (
    <Card
      title={
        <>
          <User className="w-6 h-6 mr-2" />
          {t('info_title')}
        </>
      }
      className="max-w-md w-full"
    >
      <Alert variant="info" className="mb-4 py-2">
        <span className="text-sm">
          {t('info_email_label')}: {email}
        </span>
      </Alert>

      <div className="space-y-4">
        {/* Name */}
        <Input
          label={t('name_label')}
          placeholder={t('name_placeholder')}
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={completeApi.loading}
        />

        {/* Password */}
        <div>
          <Input
            label={t('password_label')}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('password_placeholder')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={completeApi.loading}
            rightIcon={
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm Password */}
        <Input
          label={t('confirm_password_label')}
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder={t('confirm_password_placeholder')}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={completeApi.loading}
          error={
            confirmPassword && password !== confirmPassword ? t('password_mismatch') : undefined
          }
          rightIcon={
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {/* Avatar Upload */}
        <div className="pt-2">
          <AvatarUpload onUpload={setAvatarUrl} />
        </div>

        {completeApi.error && <Alert variant="error">{completeApi.error}</Alert>}

        <div className="card-actions justify-end mt-2">
          <Button
            loading={completeApi.loading}
            onClick={handleSubmit}
            disabled={!isFormValid}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {completeApi.loading ? t('registering') : t('complete_register')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
