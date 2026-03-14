import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuthMiddleware } from '@/lib/auth/middleware'
import { corsMiddleware, applyCorsHeaders } from '@/lib/security/cors'
import { siteConfig } from '@/config/site'

/**
 * Next.js middleware entry point.
 *
 * Responsibilities:
 * 1. Block direct access to the physical /admin route — users must use the
 *    alias path configured in siteConfig.admin.path instead.
 * 2. Handle CORS preflight requests for all API routes.
 * 3. Handle admin API authentication.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Block direct access to /admin when a different alias path is configured.
  // The pages physically live under app/admin/ but should only be reachable
  // through siteConfig.admin.path (e.g. /secret-admin).
  if (
    siteConfig.admin.path !== ('/admin' as never) &&
    (pathname === '/admin' || pathname.startsWith('/admin/'))
  ) {
    const url = req.nextUrl.clone()
    url.pathname = '/_not-found'
    return NextResponse.rewrite(url, { status: 404 })
  }

  // Handle CORS preflight requests for all API routes
  if (pathname.startsWith('/api/')) {
    const corsResponse = corsMiddleware(req)
    if (corsResponse) {
      return corsResponse
    }
  }

  // Handle admin authentication
  const authResponse = await adminAuthMiddleware(req)

  // Apply CORS headers to all API responses
  if (pathname.startsWith('/api/')) {
    const response = authResponse || NextResponse.next()
    return applyCorsHeaders(response, req)
  }

  return authResponse
}

export const config = {
  matcher: ['/admin/:path*', '/admin', '/api/:path*'],
}
