import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuthMiddleware } from '@/lib/auth/middleware'
import { corsMiddleware, applyCorsHeaders } from '@/lib/security/cors'

/**
 * Main middleware for the application
 * Handles CORS, authentication, and other cross-cutting concerns
 */
export async function proxy(req: NextRequest) {
  // 1. Handle CORS preflight requests for all API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const corsResponse = corsMiddleware(req)
    if (corsResponse) {
      return corsResponse
    }
  }

  // 2. Handle admin authentication
  const authResponse = await adminAuthMiddleware(req)

  // 3. Apply CORS headers to all API responses
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const response = authResponse || NextResponse.next()
    return applyCorsHeaders(response, req)
  }

  return authResponse
}

export const config = {
  matcher: [
    /*
     * Match all API routes
     */
    '/api/:path*',
  ],
}
