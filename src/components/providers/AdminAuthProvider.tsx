'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { AdminUser } from '@/types/admin'

export type { AdminUser }

interface AdminAuthContextType {
  adminUser: AdminUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

interface AdminMeResponse {
  user: AdminUser
}

interface AdminLoginResponse {
  user: AdminUser
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loginApi = useApi<AdminLoginResponse>('/api/admin/auth/login', 'POST')
  // New API to check session
  const meApi = useApi<AdminMeResponse>('/api/admin/me', 'GET')

  // Load admin user from session on mount
  useEffect(() => {
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkSession = async () => {
    try {
      const { success, data } = await meApi.request(undefined)
      if (success && data?.user) {
        setAdminUser(data.user)
      } else {
        setAdminUser(null)
      }
    } catch (e) {
      console.error('Session check failed', e)
      setAdminUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    const { success, data, error } = await loginApi.request({
      username,
      password,
    })
    if (success && data?.user) {
      const user = data.user
      setAdminUser(user)
      // localStorage.setItem('adminUser', JSON.stringify(user)) // Removed: Secure session only
    } else {
      throw new Error(error || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      // Call logout API to clear cookie
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setAdminUser(null)
      // localStorage.removeItem('adminUser') // Removed
      // localStorage.removeItem('adminUserId') // Removed
    }
  }

  const refreshUser = async () => {
    if (!adminUser) return

    // TODO: Implement refresh user API
    // For now, just keep the current user
  }

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isLoading: isLoading || loginApi.loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
