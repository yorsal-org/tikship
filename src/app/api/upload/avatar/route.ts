import { NextRequest } from 'next/server'
import { uploadService } from '@/lib/upload/service'
import { getApiTranslations } from '@/lib/i18n/config'
import { ApiResponse } from '@/lib/utils/api-response'
import { settingsService } from '@/lib/settings/service'
import { mimeTypesToFormatNames } from '@/lib/utils/common'

/**
 * Upload avatar
 * @description Upload user avatar image using configured upload provider (local or ImgBB)
 * @tag Upload
 * @contentType multipart/form-data
 * @response 200:Avatar uploaded successfully, returns URL
 * @responseSet auth
 * @openapi
 */
export async function POST(request: NextRequest) {
  const t = await getApiTranslations()

  try {
    // Get upload settings
    const uploadSettings = await settingsService.getUploadSettings()

    const formData = await request.formData()
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

    // Upload using configured provider (local or ImgBB based on UPLOAD_PROVIDER env)
    const uploadResult = await uploadService.uploadImage(file)

    if (uploadResult.success && uploadResult.url) {
      return ApiResponse.success({
        url: uploadResult.url,
      })
    } else {
      return ApiResponse.error(uploadResult.error || t('upload.failed'))
    }
  } catch (error) {
    console.error('Upload avatar error:', error)
    return ApiResponse.serverError(t('error_server'))
  }
}
