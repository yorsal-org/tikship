#!/usr/bin/env tsx

/**
 * i18n Keys Checker
 *
 * 检查所有语言文件与 en.json 的键差异
 * 用法: tsx scripts/check-i18n-keys.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 颜色输出
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

// 获取所有键（扁平化）
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

// 查找缺失的键
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

// 查找多余的键
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

// 主函数
function main(): void {
  const localesDir = path.join(__dirname, '../src/locales')
  const baseFile = 'en.json'

  console.log(colorize('\n🔍 i18n Keys Checker', 'bright'))
  console.log(colorize('='.repeat(60), 'gray'))
  console.log(colorize(`📁 Locales directory: ${localesDir}`, 'cyan'))
  console.log(colorize(`📄 Base file: ${baseFile}\n`, 'cyan'))

  // 读取基准文件
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

  // 获取所有语言文件
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

  // 检查每个语言文件
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

    // 显示统计
    console.log(colorize(`  📊 Statistics:`, 'cyan'))
    console.log(`     Total keys: ${targetKeys.length}`)
    console.log(
      `     Missing keys: ${colorize(missingKeys.length, missingKeys.length > 0 ? 'red' : 'green')}`
    )
    console.log(
      `     Extra keys: ${colorize(extraKeys.length, extraKeys.length > 0 ? 'yellow' : 'green')}`
    )

    // 显示缺失的键
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

    // 显示多余的键
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

    // 完美匹配
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(colorize(`\n  ✅ Perfect! All keys match with ${baseFile}`, 'green'))
    }

    // 添加到摘要
    summary.push({
      lang,
      status: missingKeys.length === 0 && extraKeys.length === 0 ? 'perfect' : 'issues',
      totalKeys: targetKeys.length,
      missingKeys: missingKeys.length,
      extraKeys: extraKeys.length,
    })
  })

  // 显示总结
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

// 运行
main()
