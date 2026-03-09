import { useState, useCallback } from 'react'

/**
 * Generic form state management hook
 * Provides utilities for managing form data with initial values
 */
export function useFormState<T extends Record<string, unknown>>(initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues)

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const reset = useCallback(() => {
    setFormData(initialValues)
  }, [initialValues])

  const setData = useCallback((data: T) => {
    setFormData(data)
  }, [])

  return {
    formData,
    updateField,
    updateFields,
    reset,
    setData,
  }
}
