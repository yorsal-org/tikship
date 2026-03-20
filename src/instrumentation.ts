/**
 * Next.js Instrumentation Hook
 * Runs once at server startup (dev).
 *
 * All Node.js API usage lives in instrumentation.node.ts which is loaded
 * via dynamic import() so Next.js edge-runtime static analysis never scans it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NODE_ENV !== 'development') return

  const { checkEnv } = await import('./instrumentation.node')
  checkEnv()
}
