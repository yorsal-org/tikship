'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Upload, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { useAdminSettings } from '@/hooks/useSettings'

interface ImportResult {
  title: string
  success: boolean
  error?: string
}

interface ImportResponse {
  results: ImportResult[]
  successCount: number
  failCount: number
}

interface ImportPostsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ImportPostsModal({ isOpen, onClose, onSuccess }: ImportPostsModalProps) {
  const t = useTranslations('admin.posts')
  const { admin } = useAdminSettings()
  const [jsonText, setJsonText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null)

  const { request: importPosts, loading } = useApi<ImportResponse>(
    '/api/admin/posts/import',
    'POST'
  )

  const handleClose = () => {
    setJsonText('')
    setParseError(null)
    setImportResults(null)
    onClose()
  }

  const handleSubmit = async () => {
    setParseError(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setParseError(t('import_error_invalid_json'))
      return
    }

    if (!Array.isArray(parsed)) {
      setParseError(t('import_error_not_array'))
      return
    }

    const limit = admin.articlesImportLimits
    if (parsed.length > limit) {
      setParseError(t('import_error_limit_exceeded', { limit }))
      return
    }

    const { success, data } = await importPosts(parsed, {
      onError: (err: string) => toast.error(err),
    })

    if (success && data) {
      setImportResults(data.results)
      toast.success(t('import_success', { success: data.successCount, fail: data.failCount }))
      if (data.successCount > 0) {
        onSuccess()
      }
    }
  }

  if (!isOpen) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('import_title')}
          </h3>
          <button className="btn btn-ghost btn-sm btn-square" onClick={handleClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {importResults ? (
          // Results view
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span className="text-success font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {importResults.filter(r => r.success).length} succeeded
              </span>
              <span className="text-error font-medium flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {importResults.filter(r => !r.success).length} failed
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {importResults.map((result, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm p-2 rounded ${
                    result.success ? 'bg-success/10' : 'bg-error/10'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    {result.error && (
                      <div className="text-error text-xs opacity-70">{result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-action">
              <Button variant="primary" size="sm" onClick={handleClose}>
                {t('editor.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          // Input view
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-60">{t('import_hint')}</p>
              <p className="text-xs opacity-50">
                {t('import_limit', { limit: admin.articlesImportLimits })}
              </p>
            </div>
            <div className="bg-base-200 p-3 rounded text-xs font-mono overflow-x-auto">
              <pre>{`[
  {
    "title": "Article Title",
    "content_html": "<p>Content</p>",
    "cover_image": "https://example.com/feature.jpg",
    "categories": ["Tech"],
    "tags": ["tag1", "tag2"]
  }
]`}</pre>
            </div>
            <textarea
              className={`textarea textarea-bordered w-full font-mono text-xs h-72 resize-none ${
                parseError ? 'textarea-error' : ''
              }`}
              placeholder={t('import_placeholder')}
              value={jsonText}
              onChange={e => {
                setJsonText(e.target.value)
                setParseError(null)
              }}
            />
            {parseError && (
              <p className="text-error text-xs">{parseError}</p>
            )}
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={handleClose} disabled={loading}>
                {t('editor.cancel')}
              </button>
              <Button
                variant="primary"
                size="sm"
                loading={loading}
                disabled={!jsonText.trim()}
                onClick={handleSubmit}
              >
                {loading ? t('import_importing') : t('import_submit')}
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </dialog>
  )
}
