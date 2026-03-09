import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractToken, verifyToken } from '@/lib/auth/utils'

export async function adminAuthMiddleware(req: NextRequest) {
  // Only intercept /api/admin/*
  if (!req.nextUrl.pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  // EXCEPTION: Do not intercept /api/admin/auth/* (login/logout)
  if (req.nextUrl.pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next()
  }

  // Extract token from cookie or Authorization header
  const token = extractToken(req, 'admin-token')

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      },
      { status: 401 }
    )
  }

  // Verify token
  const payload = await verifyToken(token)

  if (!payload?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Invalid session' },
      { status: 401 }
    )
  }

  // Set x-admin-user-id header
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-admin-user-id', payload.id as string)

  // Pass to next middleware
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}
