import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { settingsService, socialSettingsService } from '@/lib/settings/service'
import { PERMISSIONS } from '@/config/permissions'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit/service'
import { SETTINGS_CATEGORIES } from '@/types/settings'
import type {
  SocialSettingsValues,
  SettingsResponse,
} from '@/types/settings'

/**
 * Get all settings
 * @description Admin endpoint to get all settings by category
 * @tag Admin - Settings
 * @auth bearerAuth
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminAuth(req, PERMISSIONS.SETTINGS_VIEW)
    if (error) return error

    // Get all settings using typed methods
    // Note: theme settings are managed via siteConfig, not stored in DB
    const [social, system, locale, upload, auth, admin, payment] = await Promise.all([
      socialSettingsService.get(),
      settingsService.getSystemSettings(),
      settingsService.getLocaleSettings(),
      settingsService.getUploadSettings(),
      settingsService.getAuthSettings(),
      settingsService.getAdminSettings(),
      settingsService.getPaymentSettings(),
    ])

    const response: SettingsResponse = {
      social,
      system,
      locale,
      upload,
      auth,
      admin,
      payment,
    }

    return ApiResponse.success({ settings: response })
  } catch (error) {
    console.error('Get settings error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}

/**
 * Update settings
 * @description Admin endpoint to update settings by category
 * @tag Admin - Settings
 * @auth bearerAuth
 */
export async function PUT(req: NextRequest) {
  try {
    const { adminUserId, error } = await requireAdminAuth(req, PERMISSIONS.SETTINGS_EDIT)
    if (error) return error
    if (!adminUserId) return await ApiResponse.adminError('unauthorized', 401)

    const body = await req.json()
    const { category, updates } = body

    if (!category || !updates) {
      return await ApiResponse.adminError('invalid_request', 400)
    }

    // Handle social settings with specialized service
    if (category === SETTINGS_CATEGORIES.SOCIAL) {
      await socialSettingsService.update(updates as Partial<SocialSettingsValues>)
    } else {
      // Handle other categories with generic service
      await settingsService.update(category, updates)
    }

    await logAudit({
      adminUserId,
      action: category === SETTINGS_CATEGORIES.SOCIAL
        ? AUDIT_ACTIONS.SOCIAL_SETTINGS_UPDATE
        : AUDIT_ACTIONS.SETTINGS_UPDATE,
      resource: 'settings',
      resourceId: category,
      details: updates,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    })

    // Return updated settings
    return GET(req)
  } catch (error) {
    console.error('Update settings error:', error)
    return await ApiResponse.adminError('server_error', 500)
  }
}
