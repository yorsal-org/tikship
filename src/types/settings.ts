// Settings Module Type Definitions
// Unified settings management with category-based key-value store

// Settings categories
export const SETTINGS_CATEGORIES = {
  SYSTEM: 'system',
  SOCIAL: 'social',
  THEME: 'theme',
  LOCALE: 'locale',
  UPLOAD: 'upload',
  AUTH: 'auth',
  ADMIN: 'admin',
  PAYMENT: 'payment',
} as const

export type SettingsCategory = (typeof SETTINGS_CATEGORIES)[keyof typeof SETTINGS_CATEGORIES]

// Settings entry (database model)
export interface SettingsEntry {
  id: string
  category: string
  key: string
  value: string
  updatedAt: Date
}

// Social Settings (category: 'social')
export interface SocialSettingsValues {
  commentRequireApproval: boolean
  replyRequireApproval: boolean
  maxCommentLength: number
  maxReplyLength: number
  enableComments: boolean
  enableLikes: boolean
  sensitiveWords: string
}

// System Settings (category: 'system')
export interface SystemSettingsValues {
  supportEmail: string
  favicon: string
}

// Theme Settings - managed via siteConfig, not stored in DB
export interface ThemeSettingsValues {
  default: 'light' | 'dark' | 'system'
  lightTheme: string
  darkTheme: string
}

// Locale Settings (category: 'locale')
export interface LocaleSettingsValues {
  default: string
  supported: Array<{ value: string; label: string; nativeName: string }>
}

// Upload Settings (category: 'upload')
export interface UploadSettingsValues {
  imageMaxSizeMB: number
  imageAllowedTypes: string[]
}

// Auth Settings (category: 'auth')
export interface AuthSettingsValues {
  loginLimitsEnabled: boolean
  loginLimitsMaxAttempts: number
  loginLimitsWindowMinutes: number
  passwordMinStrength: 'weak' | 'medium' | 'strong'
}

// Admin Settings (category: 'admin') - path is managed via siteConfig, not stored in DB
export interface AdminSettingsValues {
  pageSize: number
  passwordMinStrength: 'weak' | 'medium' | 'strong'
  articlesImportLimits: number
}

// Payment Settings (category: 'payment')
export interface PaymentSettingsValues {
  currencies: Array<{ value: string; label: string }>
  defaultCurrency: string
  modes: Array<{ value: string; label: string }>
  defaultMode: string
  intervals: Array<{ value: string; label: string }>
  defaultInterval: string
  defaultIntervalCount: number
}

// Combined settings response
// Note: theme settings are managed via siteConfig, not stored in DB
export interface SettingsResponse {
  social: SocialSettingsValues
  system: SystemSettingsValues
  locale: LocaleSettingsValues
  upload: UploadSettingsValues
  auth: Partial<AuthSettingsValues>
  admin: AdminSettingsValues
  payment: PaymentSettingsValues
}

// API Request Types
export interface UpdateSettingsBody {
  category: SettingsCategory
  updates: Record<string, unknown>
}

// Default values for social settings
export const DEFAULT_SOCIAL_SETTINGS: SocialSettingsValues = {
  commentRequireApproval: true,
  replyRequireApproval: true,
  maxCommentLength: 2000,
  maxReplyLength: 1000,
  enableComments: true,
  enableLikes: true,
  sensitiveWords: '',
}
