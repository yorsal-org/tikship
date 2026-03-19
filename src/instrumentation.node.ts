/**
 * Node.js-only env checker — loaded dynamically from instrumentation.ts.
 * This file is intentionally NOT imported statically so that Next.js edge
 * runtime static analysis never scans it.
 */
import fs from 'fs'
import path from 'path'

// ─── ANSI helpers ────────────────────────────────────────────────────────────
const R = '\x1b[0m'
const BOLD = '\x1b[1m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'

// Keys that skip placeholder check but still require a non-empty value
// (their .env.example value is the intended default, not a placeholder)
const PLACEHOLDER_SKIP_KEYS = new Set(['ADMIN_USERNAME', 'ADMIN_EMAIL'])

// ─── Parse .env.example ──────────────────────────────────────────────────────
function parseEnvExample(content: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    map.set(key, value)
  }
  return map
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function checkEnv() {
  const examplePath = path.join(process.cwd(), '.env.example')

  if (!fs.existsSync(examplePath)) {
    console.warn('[ENV CHECK] .env.example not found, skipping env validation.')
    return
  }

  const exampleVars = parseEnvExample(fs.readFileSync(examplePath, 'utf-8'))
  const env = process.env

  let errorCount = 0
  let warnCount = 0
  const errors: string[] = []
  const warnings: string[] = []

  console.log(`\n${BOLD}${CYAN}╔${'═'.repeat(58)}╗${R}`)
  console.log(`${BOLD}${CYAN}║${'  Checking environment variables...'.padEnd(58)}║${R}`)
  console.log(`${BOLD}${CYAN}╚${'═'.repeat(58)}╝${R}\n`)

  for (const [key, exampleValue] of exampleVars) {
    const actualValue = env[key]

    if (actualValue === undefined || actualValue === '') {
      // Always report missing/empty, even for admin seeding keys
      const hint = exampleValue ? `${DIM}example: ${exampleValue}${R}` : ''
      console.warn(
        `  ${RED}${BOLD}[MISSING]${R}     ${RED}${key}${R}${
          hint ? `\n              ${CYAN}→ ${hint}` : ''
        }`
      )
      errors.push(key)
      errorCount++
    } else if (actualValue === exampleValue && !PLACEHOLDER_SKIP_KEYS.has(key)) {
      // Skip placeholder check for keys whose example value is the intended default
      console.warn(
        `  ${YELLOW}${BOLD}[PLACEHOLDER]${R} ${YELLOW}${key}${R}\n              ${DIM}still using example value: "${exampleValue}"${R}`
      )
      warnings.push(key)
      warnCount++
    }
  }

  console.log('')
  if (errorCount === 0 && warnCount === 0) {
    console.log(`${GREEN}${BOLD}✓ All environment variables are configured.${R}\n`)
  } else {
    if (errorCount > 0) {
      console.log(
        `${RED}${BOLD}✗ ${errorCount} missing/empty variable${
          errorCount > 1 ? 's' : ''
        }:${R} ${errors.map(k => `${RED}${k}${R}`).join(', ')}`
      )
    }
    if (warnCount > 0) {
      console.log(
        `${YELLOW}${BOLD}⚠ ${warnCount} placeholder value${
          warnCount > 1 ? 's' : ''
        } not updated:${R} ${warnings.map(k => `${YELLOW}${k}${R}`).join(', ')}`
      )
    }
    console.log(`\n  ${DIM}Run ${R}${CYAN}npm run setup:env${R}${DIM} to configure interactively.${R}\n`)
  }
}
