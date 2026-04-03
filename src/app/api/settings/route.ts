import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/api-response'
import { settingsService } from '@/lib/settings/service'
import { getAuthenticatedAdmin } from '@/lib/admin/auth'
import type { SettingsResponse } from '@/types/settings'

/**
 * Get all public settings
 * @description Public endpoint to get all settings. Admin settings are only included for authenticated admins.
 * @tag Settings
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated admin via cookie/token
    const adminUser = await getAuthenticatedAdmin(req)
    const adminUserId = adminUser?.id

    // Get all settings using typed methods
    // Note: theme settings are managed via siteConfig, not stored in DB
    const [ /*social,*/ system, locale, upload, auth, admin, payment] = await Promise.all([
      // socialSettingsService.get(),
      settingsService.getSystemSettings(),
      settingsService.getLocaleSettings(),
      settingsService.getUploadSettings(),
      settingsService.getAuthSettings(),
      settingsService.getAdminSettings(),
      settingsService.getPaymentSettings(),
    ])

    // Only include full auth, admin and payment settings for authenticated admins
    const response: Partial<SettingsResponse> = {
      // social,
      system,
      locale,
      upload,
      auth: adminUserId
        ? auth
        : { passwordMinStrength: auth.passwordMinStrength },
      admin: adminUserId ? admin : ({} as SettingsResponse['admin']),
      payment: adminUserId ? payment : ({} as SettingsResponse['payment']),
    }

    return ApiResponse.success({ settings: response })
  } catch (error) {
    console.error('Get settings error:', error)
    return await ApiResponse.serverError()
  }
}
