'use client'

import { useRef, useState, useCallback } from 'react'

// Discriminated union for API responses — use literal types for proper TS narrowing
export type ApiSuccess<T> = {
  success: true
  data: T
  message?: string
}

export type ApiFailure = {
  success: false
  error: string
  message?: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure

export interface UseApiOptions<T = unknown> {
  urlOverride?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  transform?: (data: T) => T
  onSuccess?: (result: ApiSuccess<T>) => void
  onError?: (error: string) => void
  /** Abort the previous request when a new one starts (default: true) */
  abortPrevious?: boolean
  /** Execute immediately on mount (default: false) */
  immediate?: boolean
}

export function useApi<T = unknown, Body = unknown>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST'
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  // Track current request sequence to ignore stale responses
  const requestSeq = useRef(0)
  // Abort controller for the in-flight request
  const abortControllerRef = useRef<AbortController | null>(null)

  const request = useCallback(
    async (body?: Body, options: UseApiOptions<T> = {}): Promise<ApiResult<T>> => {
      const { abortPrevious = true } = options

      // Abort previous in-flight request if needed
      if (abortPrevious && abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller and increment sequence
      const controller = new AbortController()
      abortControllerRef.current = controller
      const currentSeq = ++requestSeq.current

      setLoading(true)
      setError(null)

      try {
        let finalUrl = options.urlOverride || url
        if (options.params) {
          const searchParams = new URLSearchParams()
          Object.entries(options.params).forEach(([key, value]) => {
            if (value !== undefined) {
              searchParams.append(key, String(value))
            }
          })
          const queryString = searchParams.toString()
          if (queryString) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString
          }
        }

        const isFormData = body instanceof FormData
        const headers: Record<string, string> = {
          ...(options.headers || {}),
        }

        // Only set Content-Type for non-GET requests without FormData
        const effectiveMethod = options.method || method
        if (effectiveMethod !== 'GET' && !isFormData) {
          headers['Content-Type'] = 'application/json'
        }

        const response = await fetch(finalUrl, {
          method: effectiveMethod,
          headers,
          body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
          signal: controller.signal,
        })

        // Parse response, handling both JSON and non-JSON (e.g. 5xx error pages)
        let result: { success: boolean; data?: T; message?: string; error?: string } | null = null
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          try {
            result = await response.json()
          } catch {
            result = null
          }
        }

        // Silently ignore responses from a stale (aborted/superseded) request
        if (currentSeq !== requestSeq.current) {
          return { success: false, error: 'stale_request' } as ApiFailure
        }

        if (response.ok && result?.success) {
          const processedData = options.transform
            ? options.transform(result.data as T)
            : (result.data as T)
          setData(processedData)
          options.onSuccess?.({ success: true, data: processedData, message: result.message })
          return { success: true, data: processedData } as ApiSuccess<T>
        } else {
          const errorMessage = result?.message || result?.error || `HTTP ${response.status}`
          setError(errorMessage)
          options.onError?.(errorMessage)
          return { success: false, error: errorMessage } as ApiFailure
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: false, error: 'aborted' } as ApiFailure
        }

        // Silently ignore responses from a stale request
        if (currentSeq !== requestSeq.current) {
          return { success: false, error: 'stale_request' } as ApiFailure
        }

        const errorMessage = err instanceof Error ? err.message : 'Network error'
        setError(errorMessage)
        options.onError?.(errorMessage)
        return { success: false, error: errorMessage } as ApiFailure
      } finally {
        if (currentSeq === requestSeq.current) {
          setLoading(false)
        }
      }
    },
    [url, method]
  )

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return {
    loading,
    error,
    data,
    request,
    abort,
    setError,
    setData,
  }
}
