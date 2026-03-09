import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/utils/toast'

/**
 * Generic data fetching and refreshing hook
 * Provides utilities for fetching data and refreshing the page
 */
export function useDataFetch() {
  const router = useRouter()

  /**
   * Refresh the current page and optionally refetch data
   * @param refetchFn - Optional function to call for refetching data
   */
  const refresh = useCallback(
    async (refetchFn?: () => Promise<void>) => {
      router.refresh()
      if (refetchFn) {
        await refetchFn()
      }
    },
    [router]
  )

  /**
   * Handle successful operation with toast and refresh
   * @param message - Success message to display
   * @param refetchFn - Optional function to call for refetching data
   */
  const handleSuccess = useCallback(
    async (message: string, refetchFn?: () => Promise<void>) => {
      toast.success(message)
      await refresh(refetchFn)
    },
    [refresh]
  )

  /**
   * Handle error with toast
   * @param error - Error message to display
   */
  const handleError = useCallback((error: string) => {
    toast.error(error)
  }, [])

  return {
    refresh,
    handleSuccess,
    handleError,
  }
}
