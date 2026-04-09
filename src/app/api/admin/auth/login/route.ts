import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { adminLogin } from '@/lib/admin'
import { ApiResponse } from '@/lib/utils/api-response'
import type { AdminLoginBody } from '@/types/api'

/**
 * Admin login
 * @description Authenticate admin user with username and password
 * @tag Admin - Auth
 * @body AdminLoginBody
 * @response 200:Login successful, returns user info and sets auth cookie
 * @responseSet auth
 * @add 429 too many login attempts
 * @openapi
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body as AdminLoginBody

    if (!username || !password) {
      return await ApiResponse.adminError('username_password_required', 400)
    }

    // Attempt login
    const adminUser = await adminLogin({
      username,
      password,
    })

    // Generate JWT token
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('Admin login error: NEXTAUTH_SECRET environment variable is not set')
      return await ApiResponse.adminError('server_configuration_error', 500)
    }
    const secretEncoder = new TextEncoder().encode(secret)
    const alg = 'HS256'
    const token = await new SignJWT({
      id: adminUser.id,
      username: adminUser.username,
      isSuperuser: adminUser.isSuperuser,
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secretEncoder)

    // Set cookie
    const cookieStore = await cookies()
    // secure: only set to true when served over HTTPS
    // If NEXTAUTH_URL starts with https://, enable secure flag
    const isHttps = (process.env.NEXTAUTH_URL || '').startsWith('https://')
    cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return ApiResponse.success({
      user: adminUser,
    })
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'TOO_MANY_ATTEMPTS':
          return await ApiResponse.adminError('too_many_login_attempts', 429)
        case 'INVALID_CREDENTIALS':
          return await ApiResponse.adminError('invalid_credentials', 401)
        case 'ACCOUNT_DISABLED':
          return await ApiResponse.adminError('account_disabled', 403)
        default:
          console.error('Admin login error:', error)
          return await ApiResponse.adminError('login_failed', 500)
      }
    }
    return await ApiResponse.adminError('login_failed', 500)
  }
}
