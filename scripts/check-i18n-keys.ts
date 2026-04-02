#!/usr/bin/env tsx

/**
 * i18n Keys Checker
 *
 * Check key differences between all language files and en.json
 * Usage: tsx scripts/check-i18n-keys.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
} as const

type ColorName = keyof typeof colors

function colorize(text: string | number, color: ColorName): string {
  return `${colors[color]}${text}${colors.reset}`
}

interface KeyInfo {
  key: string
  value: unknown
  type: 'object' | 'value'
}

interface LanguageSummary {
  lang: string
  status: 'perfect' | 'issues' | 'error'
  totalKeys?: number
  missingKeys?: number
  extraKeys?: number
  error?: string
}

// Get all keys (flattened)
function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = []
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

// Find missing keys
function findMissingKeys(
  baseObj: Record<string, unknown>,
  targetObj: Record<string, unknown>,
  prefix = ''
): KeyInfo[] {
  const missing: KeyInfo[] = []
  for (const key in baseObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const baseValue = baseObj[key]

    if (!(key in targetObj)) {
      missing.push({
        key: fullKey,
        value: baseValue,
        type: typeof baseValue === 'object' ? 'object' : 'value',
      })
    } else if (typeof baseValue === 'object' && baseValue !== null && !Array.isArray(baseValue)) {
      const targetValue = targetObj[key]
      if (typeof targetValue === 'object' && targetValue !== null) {
        missing.push(
          ...findMissingKeys(
            baseValue as Record<string, unknown>,
            targetValue as Record<string, unknown>,
            fullKey
          )
        )
      }
    }
  }
  return missing
}

// Find extra keys
function findExtraKeys(
  baseObj: Record<string, unknown>,
  targetObj: Record<string, unknown>,
  prefix = ''
): KeyInfo[] {
  const extra: KeyInfo[] = []
  for (const key in targetObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const targetValue = targetObj[key]

    if (!(key in baseObj)) {
      extra.push({
        key: fullKey,
        value: targetValue,
        type: typeof targetValue === 'object' ? 'object' : 'value',
      })
    } else if (
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      const baseValue = baseObj[key]
      if (typeof baseValue === 'object' && baseValue !== null) {
        extra.push(
          ...findExtraKeys(
            baseValue as Record<string, unknown>,
            targetValue as Record<string, unknown>,
            fullKey
          )
        )
      }
    }
  }
  return extra
}

// Main function
function main(): void {
  const localesDir = path.join(__dirname, '../src/locales')
  const baseFile = 'en.json'

  console.log(colorize('\n🔍 i18n Keys Checker', 'bright'))
  console.log(colorize('='.repeat(60), 'gray'))
  console.log(colorize(`📁 Locales directory: ${localesDir}`, 'cyan'))
  console.log(colorize(`📄 Base file: ${baseFile}\n`, 'cyan'))

  // Read base file
  const basePath = path.join(localesDir, baseFile)
  if (!fs.existsSync(basePath)) {
    console.error(colorize(`❌ Base file not found: ${basePath}`, 'red'))
    process.exit(1)
  }

  let baseContent: Record<string, unknown>
  try {
    const fileContent = fs.readFileSync(basePath, 'utf-8')
    baseContent = JSON.parse(fileContent) as Record<string, unknown>
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(colorize(`❌ Failed to parse ${baseFile}: ${errorMessage}`, 'red'))
    process.exit(1)
  }

  const baseKeys = getKeys(baseContent)
  console.log(colorize(`✅ Base file (${baseFile}) loaded: ${baseKeys.length} keys\n`, 'green'))

  // Get all language files
  const files = fs
    .readdirSync(localesDir)
    .filter(file => file.endsWith('.json') && file !== baseFile)
    .sort()

  if (files.length === 0) {
    console.log(colorize('⚠️  No other language files found', 'yellow'))
    return
  }

  let hasIssues = false
  const summary: LanguageSummary[] = []

  // Check each language file
  files.forEach(file => {
    const filePath = path.join(localesDir, file)
    const lang = file.replace('.json', '')

    console.log(colorize(`\n${'─'.repeat(60)}`, 'gray'))
    console.log(colorize(`📝 Checking: ${file}`, 'bright'))
    console.log(colorize('─'.repeat(60), 'gray'))

    let content: Record<string, unknown>
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      content = JSON.parse(fileContent) as Record<string, unknown>
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(colorize(`  ❌ Failed to parse: ${errorMessage}`, 'red'))
      hasIssues = true
      summary.push({ lang, status: 'error', error: errorMessage })
      return
    }

    const targetKeys = getKeys(content)
    const missingKeys = findMissingKeys(baseContent, content)
    const extraKeys = findExtraKeys(baseContent, content)

    // Display statistics
    console.log(colorize(`  📊 Statistics:`, 'cyan'))
    console.log(`     Total keys: ${targetKeys.length}`)
    console.log(
      `     Missing keys: ${colorize(missingKeys.length, missingKeys.length > 0 ? 'red' : 'green')}`
    )
    console.log(
      `     Extra keys: ${colorize(extraKeys.length, extraKeys.length > 0 ? 'yellow' : 'green')}`
    )

    // Display missing keys
    if (missingKeys.length > 0) {
      console.log(colorize(`\n  ❌ Missing keys (${missingKeys.length}):`, 'red'))
      missingKeys.forEach(({ key, value, type }) => {
        console.log(colorize(`     - ${key}`, 'red'))
        if (type === 'value') {
          const strValue = String(value)
          const preview = strValue.length > 50 ? strValue.substring(0, 50) + '...' : strValue
          console.log(colorize(`       en: "${preview}"`, 'gray'))
        }
      })
      hasIssues = true
    }

    // Display extra keys
    if (extraKeys.length > 0) {
      console.log(colorize(`\n  ⚠️  Extra keys (${extraKeys.length}):`, 'yellow'))
      extraKeys.forEach(({ key, value, type }) => {
        console.log(colorize(`     - ${key}`, 'yellow'))
        if (type === 'value') {
          const strValue = String(value)
          const preview = strValue.length > 50 ? strValue.substring(0, 50) + '...' : strValue
          console.log(colorize(`       ${lang}: "${preview}"`, 'gray'))
        }
      })
      hasIssues = true
    }

    // Perfect match
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(colorize(`\n  ✅ Perfect! All keys match with ${baseFile}`, 'green'))
    }

    // Add to summary
    summary.push({
      lang,
      status: missingKeys.length === 0 && extraKeys.length === 0 ? 'perfect' : 'issues',
      totalKeys: targetKeys.length,
      missingKeys: missingKeys.length,
      extraKeys: extraKeys.length,
    })
  })

  // Display summary
  console.log(colorize(`\n${'='.repeat(60)}`, 'gray'))
  console.log(colorize('📋 Summary', 'bright'))
  console.log(colorize('='.repeat(60), 'gray'))

  console.log(`\n  Base: ${colorize(baseFile, 'cyan')} (${baseKeys.length} keys)`)
  console.log(`  Checked: ${files.length} language file(s)\n`)

  summary.forEach(({ lang, status, totalKeys, missingKeys, extraKeys, error }) => {
    const langDisplay = `${lang}.json`.padEnd(12)
    if (status === 'error') {
      console.log(`  ${colorize('❌', 'red')} ${langDisplay} ${colorize(`Error: ${error}`, 'red')}`)
    } else if (status === 'perfect') {
      console.log(
        `  ${colorize('✅', 'green')} ${langDisplay} ${colorize(`Perfect match (${totalKeys} keys)`, 'green')}`
      )
    } else {
      const issues: string[] = []
      if (missingKeys && missingKeys > 0) issues.push(colorize(`${missingKeys} missing`, 'red'))
      if (extraKeys && extraKeys > 0) issues.push(colorize(`${extraKeys} extra`, 'yellow'))
      console.log(
        `  ${colorize('⚠️ ', 'yellow')} ${langDisplay} ${totalKeys} keys (${issues.join(', ')})`
      )
    }
  })

  console.log(colorize('\n' + '='.repeat(60), 'gray'))

  if (hasIssues) {
    console.log(colorize('\n⚠️  Issues found! Please review the differences above.', 'yellow'))
    process.exit(1)
  } else {
    console.log(colorize('\n✅ All language files are in sync with en.json!', 'green'))
    process.exit(0)
  }
}

// Run
main()
