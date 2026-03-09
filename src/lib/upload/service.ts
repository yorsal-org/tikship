import { imgBBProvider } from '@/lib/upload/imgbb'
import { localProvider } from '@/lib/upload/local'
import { IUploadProvider, UploadResult } from '@/types/upload'

/**
 * Get upload provider based on environment configuration
 */
function getDefaultProvider(): IUploadProvider {
  const uploadType = process.env.UPLOAD_TYPE || 'local'

  switch (uploadType.toLowerCase()) {
    case 'imgbb':
      return imgBBProvider
    case 'local':
    default:
      return localProvider
  }
}

export class UploadService {
  private provider: IUploadProvider

  constructor(provider?: IUploadProvider) {
    this.provider = provider || getDefaultProvider()
  }

  /**
   * Set the upload provider
   */
  setProvider(provider: IUploadProvider) {
    this.provider = provider
  }

  /**
   * Upload image using the current provider
   */
  async uploadImage(file: File | Blob): Promise<UploadResult> {
    return this.provider.uploadImage(file)
  }
}

export const uploadService = new UploadService()
