import { NextRequest } from 'next/server'
import { uploadService } from '@/lib/upload/service'
import { siteConfig } from '@/config/site'
import { getApiTranslations } from '@/lib/i18n/config'
import { ApiResponse } from '@/lib/utils/api-response'
// import { getAuthenticatedUser } from '@/lib/auth/utils'
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
    // const user = await getAuthenticatedUser(request)
    // if (!user) {
    //   return ApiResponse.error(t('unauthorized'), 401)
    // }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return ApiResponse.error(t('upload.no_file'))
    }

    // Get format names from allowed types
    const formatNames = mimeTypesToFormatNames(siteConfig.upload.image.allowedTypes)
    const formatsText = formatNames.join(', ')

    // Validate file type
    if (!(siteConfig.upload.image.allowedTypes as readonly string[]).includes(file.type)) {
      return ApiResponse.error(t('upload.invalid_type', { formats: formatsText }))
    }

    // Validate file size
    if (file.size > siteConfig.upload.image.maxSize) {
      return ApiResponse.error(t('upload.max_size'))
    }

    // Upload using configured provider (local or ImgBB based on UPLOAD_TYPE env)
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
