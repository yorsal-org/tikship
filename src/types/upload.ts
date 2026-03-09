export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface IUploadProvider {
  uploadImage(file: File | Blob): Promise<UploadResult>
}
