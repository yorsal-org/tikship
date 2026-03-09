/**
 * ImgBB API client for image uploads
 */

import { IUploadProvider, UploadResult } from '@/types/upload'

interface ImgBBResponse {
  success: boolean
  data?: {
    url: string
    display_url: string
    delete_url: string
  }
  error?: {
    message: string
  }
}

/**
 * ImgBB implementation of upload provider
 */
export class ImgBBProvider implements IUploadProvider {
  /**
   * Upload image to ImgBB
   */
  async uploadImage(file: File | Blob): Promise<UploadResult> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file)

      // Upload to ImgBB
      // Check for API key in server (process.env)
      const apiKey = process.env.IMGBB_API_KEY

      if (!apiKey) {
        return { success: false, error: 'ImgBB API key not configured' }
      }

      const formData = new FormData()
      // Remove data:image/xxx;base64, prefix if present
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
      formData.append('image', base64Data)

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      })

      const { success, error, data }: ImgBBResponse = await response.json()

      if (success && data) {
        return { success: true, url: data.url }
      } else {
        return {
          success: false,
          error: error?.message || 'Upload failed',
        }
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      return { success: false, error: 'Upload failed, please try again later' }
    }
  }

  /**
   * Convert File/Blob to base64
   */
  private async fileToBase64(file: File | Blob): Promise<string> {
    if (typeof window === 'undefined') {
      // Server-side
      const arrayBuffer = await file.arrayBuffer()
      return Buffer.from(arrayBuffer).toString('base64')
    } else {
      // Client-side
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
      })
    }
  }
}

export const imgBBProvider = new ImgBBProvider()
