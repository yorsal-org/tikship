import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS configuration
 */
export interface CorsConfig {
  allowedOrigins: string[]
  allowedMethods: string[]
  allowedHeaders: string[]
  allowCredentials: boolean
  maxAge?: number
}

/**
 * Get allowed origins from environment variable
 * Supports comma-separated list of origins
 */
export function getAllowedOrigins(): string[] {
  const originsEnv = process.env.ALLOWED_ORIGINS || ''

  if (!originsEnv) {
    // Development mode: allow all origins
    if (process.env.NODE_ENV === 'development') {
      return ['*']
    }
    return []
  }

  // Split by comma and trim whitespace
  return originsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  // If no origin header (same-origin requests), allow it
  if (!origin) {
    return true
  }

  // Allow all origins if '*' is in the list
  if (allowedOrigins.includes('*')) {
    return true
  }

  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true
  }

  // Check wildcard patterns (e.g., *.example.com)
  return allowedOrigins.some(allowed => {
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2)
      return origin.endsWith(domain) || origin === domain
    }
    return false
  })
}

/**
 * Default CORS configuration
 */
export const defaultCorsConfig: CorsConfig = {
  allowedOrigins: getAllowedOrigins(),
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'Authorization',
  ],
  allowCredentials: true,
  maxAge: 86400, // 24 hours
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  config: CorsConfig = defaultCorsConfig
): NextResponse {
  const origin = request.headers.get('origin')

  // If no origin header (same-origin request), skip CORS headers
  if (!origin) {
    // Same-origin requests don't need CORS headers
    return response
  }

  // Check if origin is allowed
  if (isOriginAllowed(origin, config.allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin)

    // Set other CORS headers only when origin is present and allowed
    if (config.allowCredentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    response.headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(','))
    response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(','))

    if (config.maxAge) {
      response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
    }
  } else if (config.allowedOrigins.includes('*')) {
    // Allow all origins
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(','))
    response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(','))

    if (config.maxAge) {
      response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
    }
  }

  return response
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(
  request: NextRequest,
  config: CorsConfig = defaultCorsConfig
): NextResponse {
  const origin = request.headers.get('origin')

  // If no origin, allow the preflight (same-origin)
  if (!origin) {
    const response = new NextResponse(null, { status: 204 })
    return response
  }

  // Check if origin is allowed
  if (!isOriginAllowed(origin, config.allowedOrigins)) {
    if (!config.allowedOrigins.includes('*')) {
      return new NextResponse(null, { status: 403 })
    }
  }

  const response = new NextResponse(null, { status: 204 })
  return applyCorsHeaders(response, request, config)
}

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(
  request: NextRequest,
  config: CorsConfig = defaultCorsConfig
): NextResponse | null {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return null
  }

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request, config)
  }

  // For other requests, return null to continue processing
  // CORS headers will be added in the response
  return null
}
