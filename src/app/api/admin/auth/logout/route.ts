import { cookies } from 'next/headers'
import { ApiResponse } from '@/lib/utils/api-response'

/**
 * Admin logout
 * @description Logout the current admin user and clear authentication token
 * @tag Admin - Auth
 * @auth bearerAuth
 * @openapi
 */
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-token')

  return ApiResponse.success({ message: 'Logged out successfully' })
}
