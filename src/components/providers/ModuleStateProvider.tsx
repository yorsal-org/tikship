'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export interface ModuleState {
  content: boolean
  commerce: boolean
  user: boolean
  social: boolean
}

interface ModuleStateContextType {
  moduleState: ModuleState | null
  loading: boolean
  error: string | null
}

const ModuleStateContext = createContext<ModuleStateContextType>({
  moduleState: null,
  loading: true,
  error: null,
})

export function ModuleStateProvider({ children }: { children: React.ReactNode }) {
  const [moduleState, setModuleState] = useState<ModuleState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchModuleState() {
      try {
        const response = await fetch('/api/admin/modules/state', {
          method: 'GET',
          credentials: 'include',
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const result = await response.json()
        if (!cancelled) {
          setModuleState(result.data ?? result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch module state')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchModuleState()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ModuleStateContext.Provider value={{ moduleState, loading, error }}>
      {children}
    </ModuleStateContext.Provider>
  )
}

export function useModuleState() {
  const context = useContext(ModuleStateContext)
  if (context === undefined) {
    throw new Error('useModuleState must be used within a ModuleStateProvider')
  }
  return context
}
