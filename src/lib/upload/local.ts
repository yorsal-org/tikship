/**
 * Local file system upload provider
 */

import { IUploadProvider, UploadResult } from '@/types/upload'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Get current date folder name (YYYY-MM-DD)
 */
function getDateFolder(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generate unique filename
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  // Extract extension from original name or default to 'jpg'
  let ext = 'jpg'
  if (originalName && typeof originalName === 'string') {
    const parts = originalName.split('.')
    if (parts.length > 1) {
      ext = parts.pop() || 'jpg'
    }
  }

  return `${timestamp}-${random}.${ext}`
}

/**
 * Local implementation of upload provider
 * Uploads files to /public/upload/{YYYY-MM-DD}/ directory
 */
export class LocalProvider implements IUploadProvider {
  /**
   * Upload image to local file system
   */
  async uploadImage(file: File | Blob): Promise<UploadResult> {
    try {
      // Get date folder
      const dateFolder = getDateFolder()
      const uploadDir = join(process.cwd(), 'public', 'upload', dateFolder)

      // Create directory if not exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = generateFilename((file as File).name || 'image.jpg')
      const filepath = join(uploadDir, filename)

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Return public URL
      const url = `/upload/${dateFolder}/${filename}`

      return { success: true, url }
    } catch (error) {
      console.error('Failed to upload image:', error)
      return { success: false, error: 'Upload failed, please try again later' }
    }
  }
}

export const localProvider = new LocalProvider()
