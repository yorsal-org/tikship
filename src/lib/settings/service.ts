/**
 * Settings Module Service
 * Unified settings management with category-based key-value store
 */
import { prisma } from '@/lib/db/prisma'
import { siteConfig } from '@/config/site'
import {
  SETTINGS_CATEGORIES,
  type SettingsCategory,
  type SocialSettingsValues,
  type SystemSettingsValues,
  type LocaleSettingsValues,
  type UploadSettingsValues,
  type AuthSettingsValues,
  type AdminSettingsValues,
  type PaymentSettingsValues,
} from '@/types/settings'

/**
 * Filter sensitive words in content
 * Replaces matched words with asterisks
 */
export function filterSensitiveWords(content: string, words: string[]): string {
  if (!words || words.length === 0) return content

  let filtered = content
  for (const word of words) {
    if (!word || word.trim() === '') continue
    // Escape special regex characters
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
    filtered = filtered.replace(regex, '*'.repeat(word.length))
  }
  return filtered
}

// Type guard to check if value is a primitive that can be directly stored
function isPrimitive(value: unknown): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  )
}

// Convert value to string for storage
function serializeValue(value: unknown): string {
  if (isPrimitive(value)) {
    return String(value)
  }
  return JSON.stringify(value)
}

// Parse stored string value back to appropriate type
function deserializeValue(value: string, defaultValue: unknown): unknown {
  if (typeof defaultValue === 'boolean') {
    return value === 'true' ? true : value === 'false' ? false : defaultValue
  }
  if (typeof defaultValue === 'number') {
    const parsed = Number(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
  if (typeof defaultValue === 'object' && defaultValue !== null) {
    try {
      return JSON.parse(value)
    } catch {
      return defaultValue
    }
  }
  return value
}

/**
 * Settings Service
 * Provides unified CRUD operations for all settings categories
 */
export const settingsService = {
  /**
   * Get a single setting value by category and key
   */
  async get<T>(
    category: SettingsCategory,
    key: string,
    defaultValue: T
  ): Promise<T> {
    const item = await prisma.settings.findUnique({
      where: {
        category_key: {
          category,
          key,
        },
      },
    })

    if (!item) {
      return defaultValue
    }

    return deserializeValue(item.value, defaultValue) as T
  },

  /**
   * Get all settings for a specific category
   */
  async getByCategory(
    category: SettingsCategory
  ): Promise<Record<string, string>> {
    const items = await prisma.settings.findMany({
      where: { category },
    })

    return Object.fromEntries(items.map((item) => [item.key, item.value]))
  },

  /**
   * Set a single setting value
   */
  async set(
    category: SettingsCategory,
    key: string,
    value: unknown
  ): Promise<void> {
    await prisma.settings.upsert({
      where: {
        category_key: {
          category,
          key,
        },
      },
      update: {
        value: serializeValue(value),
      },
      create: {
        category,
        key,
        value: serializeValue(value),
      },
    })
  },

  /**
   * Update multiple settings for a category
   */
  async update(
    category: SettingsCategory,
    updates: Record<string, unknown>
  ): Promise<void> {
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.settings.upsert({
          where: {
            category_key: {
              category,
              key,
            },
          },
          update: {
            value: serializeValue(value),
          },
          create: {
            category,
            key,
            value: serializeValue(value),
          },
        })
      )
    )
  },

  /**
   * Delete a setting
   */
  async delete(category: SettingsCategory, key: string): Promise<void> {
    await prisma.settings.delete({
      where: {
        category_key: {
          category,
          key,
        },
      },
    })
  },

  /**
   * Initialize default settings if not exists
   */
  async initializeDefaults(
    category: SettingsCategory,
    defaults: Record<string, unknown>
  ): Promise<void> {
    const existing = await prisma.settings.findMany({
      where: { category },
    })

    const existingKeys = new Set(existing.map((item) => item.key))
    const missingKeys = Object.keys(defaults).filter(
      (key) => !existingKeys.has(key)
    )

    if (missingKeys.length === 0) return

    await Promise.all(
      missingKeys.map((key) =>
        prisma.settings.create({
          data: {
            category,
            key,
            value: serializeValue(defaults[key]),
          },
        })
      )
    )
  },

  /**
   * Get system settings with siteConfig fallback
   * Note: enableApiDocs is managed via siteConfig, not stored in DB
   */
  async getSystemSettings(): Promise<SystemSettingsValues> {
    const settings = await settingsService.getByCategory(SETTINGS_CATEGORIES.SYSTEM)

    return {
      supportEmail: settings.supportEmail || siteConfig.supportEmail,
      favicon: settings.favicon || siteConfig.favicon,
    }
  },

  /**
   * Get locale settings with siteConfig fallback
   */
  async getLocaleSettings(): Promise<LocaleSettingsValues> {
    const settings = await settingsService.getByCategory(SETTINGS_CATEGORIES.LOCALE)

    let supported: Array<{ value: string; label: string; nativeName: string }>
    try {
      supported = settings.supported
        ? JSON.parse(settings.supported)
        : [...siteConfig.locale.supported]
    } catch {
      supported = [...siteConfig.locale.supported]
    }

    return {
      default: settings.default || siteConfig.locale.default,
      supported,
    }
  },

  /**
   * Get upload settings with siteConfig fallback
   */
  async getUploadSettings(): Promise<UploadSettingsValues> {
    const settings = await settingsService.getByCategory(SETTINGS_CATEGORIES.UPLOAD)

    let allowedTypes: string[]
    try {
      allowedTypes = settings.imageAllowedTypes
        ? JSON.parse(settings.imageAllowedTypes)
        : [...siteConfig.upload.image.allowedTypes]
    } catch {
      allowedTypes = [...siteConfig.upload.image.allowedTypes]
    }

    return {
      imageMaxSizeMB: Number(settings.imageMaxSizeMB) || siteConfig.upload.image.maxSize,
      imageAllowedTypes: allowedTypes,
    }
  },

  /**
   * Get auth settings with siteConfig fallback
   */
  async getAuthSettings(): Promise<AuthSettingsValues> {
    const settings = await settingsService.getByCategory(SETTINGS_CATEGORIES.AUTH)

    return {
      loginLimitsEnabled: settings.loginLimitsEnabled !== 'false',
      loginLimitsMaxAttempts: Number(settings.loginLimitsMaxAttempts) || siteConfig.auth.loginLimits.maxAttempts,
      loginLimitsWindowMinutes: Number(settings.loginLimitsWindowMinutes) || siteConfig.auth.loginLimits.windowMinutes,
      passwordMinStrength: (settings.passwordMinStrength as 'weak' | 'medium' | 'strong') || siteConfig.auth.password.minStrength,
    }
  },

  /**
   * Get admin settings with siteConfig fallback
   */
  async getAdminSettings(): Promise<AdminSettingsValues> {
    const settings = await settingsService.getByCategory(SETTINGS_CATEGORIES.ADMIN)

    return {
      pageSize: Number(settings.pageSize) || siteConfig.admin.pageSize,
      passwordMinStrength: (settings.passwordMinStrength as 'weak' | 'medium' | 'strong') || siteConfig.admin.password.minStrength,
      articlesImportLimits: Number(settings.articlesImportLimits) || siteConfig.admin.articlesImportLimits,
    }
  },

  /**
   * Get payment settings with siteConfig fallback
   */
  async getPaymentSettings(): Promise<PaymentSettingsValues> {
    const settings = await settingsService.getByCategory(SETTINGS_CATEGORIES.PAYMENT)

    let currencies: Array<{ value: string; label: string }>
    try {
      currencies = settings.currencies
        ? JSON.parse(settings.currencies)
        : [...siteConfig.payment.currencies]
    } catch {
      currencies = [...siteConfig.payment.currencies]
    }

    let modes: Array<{ value: string; label: string }>
    try {
      modes = settings.modes
        ? JSON.parse(settings.modes)
        : [...siteConfig.payment.modes]
    } catch {
      modes = [...siteConfig.payment.modes]
    }

    let intervals: Array<{ value: string; label: string }>
    try {
      intervals = settings.intervals
        ? JSON.parse(settings.intervals)
        : [...siteConfig.payment.intervals]
    } catch {
      intervals = [...siteConfig.payment.intervals]
    }

    return {
      currencies,
      defaultCurrency: settings.defaultCurrency || siteConfig.payment.defaultCurrency,
      modes,
      defaultMode: settings.defaultMode || siteConfig.payment.defaultMode,
      intervals,
      defaultInterval: settings.defaultInterval || siteConfig.payment.defaultInterval,
      defaultIntervalCount: Number(settings.defaultIntervalCount) || siteConfig.payment.defaultIntervalCount,
    }
  },
}

/**
 * Social Settings Service
 * Specialized service for social module settings
 */
export const socialSettingsService = {
  /**
   * Get social settings
   */
  async get(): Promise<SocialSettingsValues> {
    const settings = await settingsService.getByCategory(SETTINGS_CATEGORIES.SOCIAL)

    return {
      commentRequireApproval:
        settings.commentRequireApproval === 'true' ||
        settings.commentRequireApproval === undefined,
      replyRequireApproval:
        settings.replyRequireApproval === 'true' ||
        settings.replyRequireApproval === undefined,
      maxCommentLength: Number(settings.maxCommentLength) || 2000,
      maxReplyLength: Number(settings.maxReplyLength) || 1000,
      enableComments:
        settings.enableComments === 'true' ||
        settings.enableComments === undefined,
      enableLikes:
        settings.enableLikes === 'true' || settings.enableLikes === undefined,
      sensitiveWords: settings.sensitiveWords || '',
    }
  },

  /**
   * Update social settings
   */
  async update(updates: Partial<SocialSettingsValues>): Promise<void> {
    await settingsService.update(SETTINGS_CATEGORIES.SOCIAL, updates)
  },

  /**
   * Initialize default social settings
   */
  async initializeDefaults(): Promise<void> {
    await settingsService.initializeDefaults(SETTINGS_CATEGORIES.SOCIAL, {
      commentRequireApproval: true,
      replyRequireApproval: true,
      maxCommentLength: 2000,
      maxReplyLength: 1000,
      enableComments: true,
      enableLikes: true,
      sensitiveWords: '',
    })
  },

  /**
   * Get sensitive words as array
   */
  async getSensitiveWords(): Promise<string[]> {
    const sensitiveWords = await settingsService.get(
      SETTINGS_CATEGORIES.SOCIAL,
      'sensitiveWords',
      ''
    )

    if (!sensitiveWords) return []

    return String(sensitiveWords)
      .split(',')
      .map((w: string) => w.trim().toLowerCase())
      .filter((w: string) => w.length > 0)
  },

  /**
   * Check if feature is enabled
   */
  async isFeatureEnabled(feature: 'comments' | 'likes'): Promise<boolean> {
    if (feature === 'comments') {
      return await settingsService.get(
        SETTINGS_CATEGORIES.SOCIAL,
        'enableComments',
        true
      )
    }
    return await settingsService.get(
      SETTINGS_CATEGORIES.SOCIAL,
      'enableLikes',
      true
    )
  },
}
