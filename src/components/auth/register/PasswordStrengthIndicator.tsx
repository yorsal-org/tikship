'use client'

import { useTranslations } from 'next-intl'
import { validatePasswordStrength } from '@/lib/utils/validators'
import { useAuthSettings } from '@/hooks/useSettings'

interface PasswordStrengthIndicatorProps {
  password: string
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const t = useTranslations('register')
  const { auth } = useAuthSettings()
  const minStrength = auth.passwordMinStrength

  const strength = validatePasswordStrength(password)

  const strengthWeight = {
    none: 0,
    weak: 1,
    medium: 2,
    strong: 3,
  }

  const isStrengthMet =
    (strengthWeight as Record<string, number>)[strength.level] >=
    (strengthWeight as Record<string, number>)[minStrength]

  const getLabel = () => {
    switch (strength.level) {
      case 'strong':
        return t('password_strength.strong')
      case 'medium':
        return t('password_strength.medium')
      case 'weak':
        return t('password_strength.weak')
      default:
        return ''
    }
  }

  const getMinStrengthLabel = () => {
    switch (minStrength) {
      case 'strong':
        return t('password_strength.strong')
      case 'medium':
        return t('password_strength.medium')
      case 'weak':
        return t('password_strength.weak')
      default:
        return ''
    }
  }

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{t('password_strength.title')}:</span>
          <span
            className={`text-sm font-semibold ${
              strength.level === 'strong'
                ? 'text-success'
                : strength.level === 'medium'
                  ? 'text-warning'
                  : strength.level === 'weak'
                    ? 'text-error'
                    : 'text-neutral'
            }`}
          >
            {getLabel()}
          </span>
        </div>
        <div className="text-xs opacity-70">
          {t('password_strength.requirement')}:{' '}
          <span className={isStrengthMet ? 'text-success font-medium' : 'text-error font-medium'}>
            {getMinStrengthLabel()}
          </span>
        </div>
      </div>
      <progress
        className={`progress w-full ${
          strength.level === 'strong'
            ? 'progress-success'
            : strength.level === 'medium'
              ? 'progress-warning'
              : strength.level === 'weak'
                ? 'progress-error'
                : 'progress-neutral'
        }`}
        value={strength.score}
        max="100"
      ></progress>
      {strength.errors.length > 0 && (
        <ul className="text-xs text-error mt-2 space-y-1">
          {strength.errors.map((error: string, index: number) => (
            <li key={index}>• {t(error)}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
