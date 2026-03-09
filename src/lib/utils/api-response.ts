import { NextResponse } from 'next/server'
import { getTranslations } from 'next-intl/server'

/**
 * Consistent API response helper
 */
export const ApiResponse = {
  success(data: Record<string, unknown> | unknown[] = {}, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status }
    )
  },

  error(message: string, status = 400) {
    return NextResponse.json(
      { success: false, error: message, message }, // Include both for compatibility
      { status }
    )
  },

  /**
   * Error response with translation support for admin APIs
   */
  async adminError(errorCode: string, status = 400) {
    const t = await getTranslations('api.admin')

    // Convert error code to translation key (lowercase with underscores)
    const key = errorCode.toLowerCase()

    // Try to get translation, fallback to error code if not found
    let message: string
    try {
      message = t(key)
    } catch {
      message = errorCode
    }

    return NextResponse.json({ success: false, error: errorCode, message }, { status })
  },

  unauthorized(message = 'Unauthorized') {
    return this.error(message, 401)
  },

  notFound(message = 'Not Found') {
    return this.error(message, 404)
  },

  serverError(message = 'Internal Server Error') {
    return this.error(message, 500)
  },
}
