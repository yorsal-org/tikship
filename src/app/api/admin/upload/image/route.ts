import { NextRequest } from 'next/server'
import { uploadService } from '@/lib/upload/service'
import { getApiTranslations } from '@/lib/i18n/config'
import { requireAdminAuth } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import { PERMISSIONS } from '@/config/permissions'
import { settingsService } from '@/lib/settings/service'
import { mimeTypesToFormatNames } from '@/lib/utils/common'

/**
 * Upload image by admin
 * @description Upload an image file to local public directory or ImgBB storage. Supports common image formats with size and type validation.
 * @tag Upload
 * @auth sessionAuth
 * @contentType multipart/form-data
 * @responseSet auth
 * @openapi
 */
export async function POST(req: NextRequest) {
  const t = await getApiTranslations()

  try {
    const { error } = await requireAdminAuth(req, [
      PERMISSIONS.ARTICLE_CREATE,
      PERMISSIONS.ARTICLE_EDIT,
      PERMISSIONS.PAGE_CREATE,
      PERMISSIONS.PAGE_EDIT,
      PERMISSIONS.PRODUCT_CREATE,
      PERMISSIONS.PRODUCT_EDIT,
    ])
    if (error) return error

    // Get upload settings
    const uploadSettings = await settingsService.getUploadSettings()

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return ApiResponse.error(t('upload.no_file'))
    }

    // Get format names from allowed types
    const formatNames = mimeTypesToFormatNames(uploadSettings.imageAllowedTypes)
    const formatsText = formatNames.join(', ')

    // Validate file type
    if (!uploadSettings.imageAllowedTypes.includes(file.type)) {
      return ApiResponse.error(t('upload.invalid_type', { formats: formatsText }))
    }

    // Validate file size
    if (file.size > uploadSettings.imageMaxSizeMB * 1024 * 1024) {
      return ApiResponse.error(t('upload.max_size'))
    }

    // Upload to ImgBB
    const uploadResult = await uploadService.uploadImage(file)

    if (uploadResult.success && uploadResult.url) {
      return ApiResponse.success({
        url: uploadResult.url,
      })
    } else {
      return ApiResponse.error(uploadResult.error || t('upload.failed'))
    }
  } catch (error) {
    console.error('Upload image error:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}
