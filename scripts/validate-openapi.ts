#!/usr/bin/env node

/**
 * Validate OpenAPI specification
 *
 * This script checks if the generated OpenAPI JSON is valid
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const OPENAPI_FILE = join(process.cwd(), 'public', 'openapi.json')

try {
  console.log('🔍 Validating OpenAPI specification...\n')

  // Read the OpenAPI file
  const content = readFileSync(OPENAPI_FILE, 'utf-8')
  const spec = JSON.parse(content)

  // Basic validation
  const errors = []
  const warnings = []

  // Check required fields
  if (!spec.openapi) {
    errors.push('Missing "openapi" field')
  } else if (!spec.openapi.startsWith('3.0')) {
    warnings.push(`OpenAPI version ${spec.openapi} may not be fully supported`)
  }

  if (!spec.info) {
    errors.push('Missing "info" field')
  } else {
    if (!spec.info.title) errors.push('Missing "info.title"')
    if (!spec.info.version) errors.push('Missing "info.version"')
  }

  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('No paths defined')
  }

  // Count endpoints
  const pathCount = Object.keys(spec.paths || {}).length
  let methodCount = 0
  const tags = new Set()

  Object.values(spec.paths || {}).forEach((path: unknown) => {
    if (path && typeof path === 'object') {
      Object.entries(path).forEach(([method, operation]: [string, unknown]) => {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          methodCount++
          if (operation && typeof operation === 'object' && 'tags' in operation) {
            const opTags = (operation as { tags?: string[] }).tags
            if (Array.isArray(opTags)) {
              opTags.forEach((tag: string) => tags.add(tag))
            }
          }
        }
      })
    }
  })

  // Print results
  console.log('📊 Statistics:')
  console.log(`   Paths: ${pathCount}`)
  console.log(`   Operations: ${methodCount}`)
  console.log(`   Tags: ${tags.size}`)
  console.log(`   Servers: ${(spec.servers || []).length}`)
  console.log(
    `   Security Schemes: ${Object.keys(spec.components?.securitySchemes || {}).length}\n`
  )

  if (tags.size > 0) {
    console.log('🏷️  Tags:')
    Array.from(tags)
      .sort()
      .forEach(tag => {
        console.log(`   - ${tag}`)
      })
    console.log()
  }

  // Print errors and warnings
  if (errors.length > 0) {
    console.log('❌ Errors:')
    errors.forEach(error => console.log(`   - ${error}`))
    console.log()
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:')
    warnings.forEach(warning => console.log(`   - ${warning}`))
    console.log()
  }

  console.log('✅ OpenAPI specification is valid!\n')
  console.log(`📄 File: ${OPENAPI_FILE}`)
  console.log(`📏 Size: ${(content.length / 1024).toFixed(2)} KB\n`)

  process.exit(0)
} catch (error: unknown) {
  console.error('❌ Error validating OpenAPI specification:')
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`   ${errorMessage}\n`)
  process.exit(1)
}
