'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { siteConfig } from '@/config/site'
import type {
  SettingsResponse,
  SocialSettingsValues,
  SystemSettingsValues,
  LocaleSettingsValues,
  UploadSettingsValues,
  AuthSettingsValues,
  AdminSettingsValues,
  PaymentSettingsValues,
} from '@/types/settings'

interface SettingsContextValue {
  settings: SettingsResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  loading: true,
  error: null,
  refetch: async () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings(data.data.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}

// Default values for fallback (used when API is not yet loaded)
// All values are sourced from siteConfig for consistency

const DEFAULT_LOCALE: LocaleSettingsValues = {
  default: siteConfig.locale.default,
  supported: siteConfig.locale.supported.map(l => ({ ...l })),
}

const DEFAULT_UPLOAD: UploadSettingsValues = {
  imageMaxSizeMB: siteConfig.upload.image.maxSize,
  imageAllowedTypes: [...siteConfig.upload.image.allowedTypes],
}

export const DEFAULT_AUTH: AuthSettingsValues = {
  loginLimitsEnabled: siteConfig.auth.loginLimits.enabled,
  loginLimitsMaxAttempts: siteConfig.auth.loginLimits.maxAttempts,
  loginLimitsWindowMinutes: siteConfig.auth.loginLimits.windowMinutes,
  passwordMinStrength: siteConfig.auth.password.minStrength,
}

// Admin settings - path comes from siteConfig, rest from DB
const DEFAULT_ADMIN_DB: Omit<AdminSettingsValues, 'path'> = {
  pageSize: siteConfig.admin.pageSize,
  passwordMinStrength: siteConfig.admin.password.minStrength,
  articlesImportLimits: siteConfig.admin.articlesImportLimits,
}

const DEFAULT_SYSTEM: SystemSettingsValues = {
  supportEmail: siteConfig.supportEmail,
  favicon: siteConfig.favicon,
}

const DEFAULT_PAYMENT: PaymentSettingsValues = {
  currencies: siteConfig.payment.currencies.map(c => ({ ...c })),
  defaultCurrency: siteConfig.payment.defaultCurrency,
  modes: siteConfig.payment.modes.map(m => ({ ...m })),
  defaultMode: siteConfig.payment.defaultMode,
  intervals: siteConfig.payment.intervals.map(i => ({ ...i })),
  defaultInterval: siteConfig.payment.defaultInterval,
  defaultIntervalCount: siteConfig.payment.defaultIntervalCount,
}

const DEFAULT_SOCIAL: SocialSettingsValues = {
  commentRequireApproval: true,
  replyRequireApproval: true,
  maxCommentLength: 2000,
  maxReplyLength: 1000,
  enableComments: true,
  enableLikes: true,
  sensitiveWords: '',
}

// Theme is always from siteConfig (not stored in DB)
export const DEFAULT_THEME = siteConfig.theme

export function useThemeSettings() {
  return { theme: DEFAULT_THEME, loading: false }
}

export function useLocaleSettings() {
  const { settings, loading } = useSettings()

  const locale: LocaleSettingsValues = settings?.locale ?? DEFAULT_LOCALE

  return { locale, loading }
}

export function useUploadSettings() {
  const { settings, loading } = useSettings()

  const upload: UploadSettingsValues = settings?.upload ?? DEFAULT_UPLOAD

  return { upload, loading }
}

export function useAuthSettings() {
  const { settings, loading } = useSettings()

  const auth: AuthSettingsValues = {
    ...DEFAULT_AUTH,
    ...settings?.auth,
  }

  return { auth, loading }
}

export function useAdminSettings() {
  const { settings, loading } = useSettings()

  // Admin path is from siteConfig, other settings from DB
  const admin: AdminSettingsValues & { path: string } = {
    path: siteConfig.admin.path,
    ...(settings?.admin ?? DEFAULT_ADMIN_DB),
  }

  return { admin, loading }
}

export function useSystemSettings() {
  const { settings, loading } = useSettings()

  const system: SystemSettingsValues = settings?.system ?? DEFAULT_SYSTEM

  return { system, loading }
}

export function usePaymentSettings() {
  const { settings, loading } = useSettings()

  const payment: PaymentSettingsValues = settings?.payment ?? DEFAULT_PAYMENT

  return { payment, loading }
}

export function useSocialSettings() {
  const { settings, loading } = useSettings()

  const social: SocialSettingsValues = settings?.social ?? DEFAULT_SOCIAL

  return { social, loading }
}
