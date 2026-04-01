'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useApi } from '@/hooks/useApi'
import { ApiResponse } from '@/types/api'
import { siteConfig } from '@/config/site'
import { mimeTypesToFormatNames } from '@/lib/utils/common'
import Image from 'next/image'

interface AvatarUploadProps {
  value?: string | null
  onUpload: (url: string) => void
}

interface UploadResponse {
  url: string
}

export default function AvatarUpload({ value, onUpload }: AvatarUploadProps) {
  const t = useTranslations('register')
  const [preview, setPreview] = useState<string | null>(() => value || null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get format names from allowed types
  const formatNames = mimeTypesToFormatNames(siteConfig.upload.image.allowedTypes)
  const formatsText = formatNames.join(', ')

  const uploadApi = useApi<UploadResponse>('/api/upload/avatar', 'POST')

  // Sync preview with value prop changes using ref to avoid cascading renders
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value
      if (value !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreview(value)
      }
    }
  }, [value])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    // Validate file type
    if (!(siteConfig.upload.image.allowedTypes as readonly string[]).includes(file.type)) {
      setError(t('avatar_upload.error_type', { formats: formatsText }))
      return
    }

    // Validate file size
    if (file.size > siteConfig.upload.image.maxSize) {
      setError(t('avatar_upload.error_size'))
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = e => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    const formData = new FormData()
    formData.append('file', file)

    await uploadApi.request(formData, {
      onError: (err: string) => {
        setError(err)
        setPreview(null)
      },
      onSuccess: (res: ApiResponse<{ url: string }>) => {
        if (res.data?.url) {
          onUpload(res.data.url)
        }
      },
    })
  }

  const handleRemove = () => {
    setPreview(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <fieldset className="fieldset">
      <label className="label">
        <span className="label-text">{t('avatar_upload.label')}</span>
      </label>

      <div className="flex items-center gap-4 mt-2">
        {preview ? (
          <div className="relative">
            <div className="avatar">
              <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative overflow-hidden">
                <Image src={preview} alt="Avatar preview" fill className="object-cover" />
              </div>
            </div>
            {uploadApi.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {!uploadApi.loading && (
              <button
                type="button"
                className="btn btn-circle btn-secondary btn-xs absolute -top-2 -right-2"
                onClick={handleRemove}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="avatar placeholder">
            <div className="w-24 h-24 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
              <Upload className="w-8 h-8" />
            </div>
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            className="file-input file-w-full"
            accept={siteConfig.upload.image.allowedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={uploadApi.loading}
          />
          <p className="text-xs text-base-content/60 mt-2">
            {t('avatar_upload.hint', { formats: formatsText })}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mt-2">
          <span className="text-sm">{error}</span>
        </div>
      )}
    </fieldset>
  )
}
