'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Loader2, Trash2 } from 'lucide-react'
import { toast } from '@/lib/utils/toast'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  maxSize?: number // MB
  allowedTypes?: string[]
  disabled?: boolean
  uploadEndpoint?: string
  label?: string
  placeholder?: string
}

export function ImageUpload({
  value,
  onChange,
  maxSize = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false,
  uploadEndpoint = '/api/admin/upload/image',
  label,
  placeholder = 'https://...',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageFile = async (file: File) => {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.data?.url) {
        onChange(data.data.url)
        toast.success('Image uploaded successfully')
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0])
    }
  }

  const handleImageClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  const handleRemoveImage = () => {
    onChange('')
  }

  const allowedTypesDisplay = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')

  return (
    <fieldset className="fieldset">
      {label && (
        <label className="label">
          <span className="label-text">{label}</span>
        </label>
      )}

      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-base-content/10 aspect-video max-w-md">
          <Image src={value} alt="Uploaded image" fill className="object-cover" />
          {!disabled && (
            <button
              type="button"
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              onClick={handleRemoveImage}
            >
              <Trash2 size={24} />
            </button>
          )}
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={allowedTypes.join(',')}
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
          />
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-base-content/20 bg-base-200/30 hover:border-primary'
            } ${disabled || uploading ? 'pointer-events-none opacity-50' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleImageClick}
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <Loader2 size={32} className="animate-spin opacity-50" />
                  <span className="text-xs font-bold opacity-50">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={32} className="opacity-50" />
                  <span className="text-xs font-bold opacity-50">
                    Drag & drop or click to upload
                  </span>
                  <span className="text-[10px] opacity-30">
                    {allowedTypesDisplay} (Max {maxSize}MB)
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="divider text-xs opacity-30">OR</div>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="input input-bordered w-full"
            disabled={disabled}
          />
        </div>
      )}
    </fieldset>
  )
}
