'use client'

import { useState, useCallback } from 'react'
import { ApiResponse, UseApiOptions } from '@/types/api'

export function useApi<T = unknown, Body = unknown>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST'
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const request = useCallback(
    async (body?: Body, options: UseApiOptions<T> = {}) => {
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

        if (!isFormData) {
          headers['Content-Type'] = 'application/json'
        }

        const response = await fetch(finalUrl, {
          method: options.method || method,
          headers,
          body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
        })

        const result: ApiResponse<T> = await response.json()

        if (response.ok && result.success) {
          const processedData = options.transform
            ? options.transform(result.data as T)
            : (result.data as T)
          setData(processedData)
          options.onSuccess?.(result)
          return { success: true, data: processedData, result }
        } else {
          const errorMessage = result.message || 'Something went wrong'
          setError(errorMessage)
          options.onError?.(errorMessage)
          return { success: false, error: errorMessage, result }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error'
        setError(errorMessage)
        options.onError?.(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [url, method]
  )

  return {
    loading,
    error,
    data,
    request,
    setError,
    setData,
  }
}
