'use client'

import { useAdminAuth } from '@/components/providers/AdminAuthProvider'

/**
 * Hook to check if current admin user has a specific permission
 */
export function usePermission(): boolean {
  const { adminUser } = useAdminAuth()

  // Calculate permission directly without state
  if (adminUser?.isSuperuser) {
    return true
  }

  // TODO: Fetch user permissions from API and check
  // For now, assume no permission if not superuser
  return false
}

/**
 * Hook to check if current admin user has any of the specified permissions
 */
export function useAnyPermission(): boolean {
  const { adminUser } = useAdminAuth()

  // Calculate permission directly without state
  if (adminUser?.isSuperuser) {
    return true
  }

  // TODO: Fetch user permissions from API and check
  // For now, assume no permission if not superuser
  return false
}

/**
 * Hook to check if current admin user is superuser
 */
export function useIsSuperuser(): boolean {
  const { adminUser } = useAdminAuth()
  return adminUser?.isSuperuser || false
}
