#!/usr/bin/env tsx

/**
 * Business Module Manager
 *
 * Manages the deletion and restoration of three business modules: Content Management, Commerce, and User Management
 *
 * Usage:
 *   tsx scripts/module-manager.ts                    # Interactive menu
 *   tsx scripts/module-manager.ts --delete content    # Delete specified module
 *   tsx scripts/module-manager.ts --restore content   # Restore specified module
 *   tsx scripts/module-manager.ts --status           # View status only
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')

// Module definition
interface ModuleConfig {
  key: 'content' | 'commerce' | 'user'
  name: string
  description: string
  keyFiles: string[] // Key files to detect if module exists
  backupFiles: {
    src: string[]
    prisma: string[] // Schema files under prisma/models/
    schemaName: string // PostgreSQL schema name
  }
}

// Define model list for each module
const MODULE_MODELS: Record<string, string[]> = {
  content: ['Post', 'Category', 'Tag'],
  commerce: ['Product', 'Order', 'PaymentMethod'],
  user: ['User'],
}

const modules: ModuleConfig[] = [
  {
    key: 'content',
    name: 'Content Management',
    description: 'Articles, pages, categories, tags management',
    keyFiles: ['src/app/admin/articles/page.tsx'],
    backupFiles: {
      src: [
        'src/app/admin/articles',
        'src/app/admin/pages',
        'src/app/admin/categories',
        'src/app/blog',
        'src/app/p',
        'src/components/admin/post',
        'src/components/post/PostContent.tsx',
        'src/app/api/admin/posts',
        'src/app/api/admin/categories',
        'src/app/api/admin/tags',
        'src/app/api/posts',
        'src/app/api/admin/dashboard/widgets/content-stats',
        'src/lib/post',
      ],
      prisma: ['prisma/models/content.prisma'],
      schemaName: 'content',
    },
  },
  {
    key: 'commerce',
    name: 'Commerce',
    description: 'Products, orders, payment management',
    keyFiles: ['src/app/admin/products/page.tsx'],
    backupFiles: {
      src: [
        'src/app/admin/products',
        'src/app/admin/orders',
        'src/app/products',
        'src/app/payment',
        'src/components/admin/product',
        'src/components/admin/order',
        'src/app/api/admin/products',
        'src/app/api/admin/orders',
        'src/app/api/admin/dashboard/widgets/commerce-stats',
        'src/app/api/products',
        'src/app/api/stripe',
        'src/app/api/paypal',
        'src/lib/payment',
        'src/lib/email/order.ts',
      ],
      prisma: ['prisma/models/commerce.prisma'],
      schemaName: 'commerce',
    },
  },
  {
    key: 'user',
    name: 'User Management',
    description: 'Member/front-end user management',
    keyFiles: ['src/app/admin/members/page.tsx', 'src/app/login/page.tsx', 'src/app/register/page.tsx'],
    backupFiles: {
      src: [
        'src/app/admin/members',
        'src/components/admin/member',
        'src/app/api/admin/members',
        'src/app/api/admin/dashboard/widgets/user-stats',
        'src/app/api/user',
        'src/app/api/auth',
        'src/app/user',
        'src/app/login',
        'src/app/register',
        'src/components/user',
        'src/lib/auth',
        'src/lib/email/verification.ts',
        'src/lib/email/templates-verification.ts'
      ],
      prisma: ['prisma/models/user_management.prisma'],
      schemaName: 'user_management',
    },
  },
]

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

// Check if module is enabled (exists)
function isModuleEnabled(mod: ModuleConfig): boolean {
  return mod.keyFiles.some(file =>
    fs.existsSync(path.join(projectRoot, file))
  )
}

// Check if module is backed up
function isModuleBackedUp(mod: ModuleConfig): boolean {
  const backupDir = path.join(projectRoot, '.modules-logs', mod.key)
  return fs.existsSync(backupDir) && fs.readdirSync(backupDir).length > 0
}

// Get module state
function getModuleState(mod: ModuleConfig): 'enabled' | 'disabled' {
  return isModuleEnabled(mod) ? 'enabled' : 'disabled'
}

// Read meta.json
function readMeta(moduleKey: string): { deletedAt?: string; files?: string[] } | null {
  const metaPath = path.join(projectRoot, '.modules-logs', moduleKey, 'meta.json')
  if (fs.existsSync(metaPath)) {
    try {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    } catch {
      return null
    }
  }
  return null
}

// Write meta.json
function writeMeta(moduleKey: string, meta: { deletedAt: string; files: string[] }): void {
  const metaPath = path.join(projectRoot, '.modules-logs', moduleKey, 'meta.json')
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
}

// Get list of currently enabled modules
function getEnabledModules(): ModuleConfig[] {
  return modules.filter(m => isModuleEnabled(m))
}

// Get list of models for currently enabled modules
function getEnabledModels(): Set<string> {
  const enabledModels = new Set<string>()
  for (const mod of modules) {
    if (isModuleEnabled(mod)) {
      const models = MODULE_MODELS[mod.key] || []
      models.forEach(m => enabledModels.add(m))
    }
  }
  return enabledModels
}

// Unify handling of all schema file dependencies
// Called after delete or restore operations
function syncSchemaDependencies(): void {
  console.log(colorize('\n🔄 Syncing schema dependencies...', 'cyan'))
  console.log(colorize('='.repeat(60), 'gray'))

  const enabledModels = getEnabledModels()
  console.log(colorize(`  📋 Enabled models: ${Array.from(enabledModels).join(', ') || '(none)'}`, 'gray'))

  const modelsDir = path.join(projectRoot, 'prisma', 'models')

  // Get all .prisma files in models directory
  if (!fs.existsSync(modelsDir)) {
    console.log(colorize('  ℹ️  No models directory found', 'gray'))
    return
  }

  const prismaFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.prisma'))
  console.log(colorize(`  📁 Found ${prismaFiles.length} prisma files`, 'gray'))

  for (const file of prismaFiles) {
    const filePath = path.join(modelsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    let modified = false

    // Implementation: iterate through each line, check if fields reference disabled models
    const lines = content.split('\n')
    const newLines: string[] = []
    let insideModel = false
    let currentModel = ''

    for (const line of lines) {
      // Detect entering or leaving a model block
      const modelStartMatch = line.match(/^model\s+(\w+)\s*\{/)
      if (modelStartMatch) {
        insideModel = true
        currentModel = modelStartMatch[1]
        newLines.push(line)
        continue
      }

      if (line.trim() === '}') {
        insideModel = false
        currentModel = ''
        newLines.push(line)
        continue
      }

      // If not inside a model block, keep the original line
      if (!insideModel) {
        newLines.push(line)
        continue
      }

      // Check if it's a comment line, if so keep it (may need to uncomment)
      const trimmedLine = line.trim()
      const isCommented = trimmedLine.startsWith('//')

      // Try to match field line: "  fieldName  Type  @relation(...)" or "  // fieldName  Type  // comment"
      // Field types may be: ModelName, ModelName?, ModelName[], etc.
      // Note: fields in prisma files have leading spaces, comments may be at end of line
      const fieldMatch = line.match(/^(\s*)(\/\/\s*)?(\w+)\s+(\w+)(\?|\[\])?(\s+(@relation|@@index).*)?(\s+\/\/.*)?$/)

      if (fieldMatch) {
        const [, leadingSpaces, isCommentPrefix, fieldName, typeName] = fieldMatch
        const isFieldCommented = !!isCommentPrefix

        // Check if the type name is a model that needs processing
        // Remove optional marker (?) and array marker ([])
        const cleanTypeName = typeName.replace(/\?$/, '').replace(/\[\]$/, '')

        // Check if this type is in the known model list (any module's models)
        const isKnownModel = MODULE_MODELS.content.includes(cleanTypeName) ||
            MODULE_MODELS.commerce.includes(cleanTypeName) ||
            MODULE_MODELS.user.includes(cleanTypeName)

        if (isKnownModel) {
          const isEnabled = enabledModels.has(cleanTypeName)

          if (isEnabled) {
            // Model is enabled
            if (isFieldCommented) {
              // Uncomment: remove "// " but keep leading spaces
              const uncommentedLine = leadingSpaces + line.trim().replace(/^\/\/\s*/, '')
              newLines.push(uncommentedLine)
              console.log(`  🔓 ${colorize(`${fieldName} ${typeName}`, 'green')} -> uncommented (${file})`)
              modified = true
            } else {
              newLines.push(line)
            }
          } else {
            // Model is disabled, needs to be commented
            if (!isFieldCommented) {
              // Comment: add "// " after leading spaces
              const commentedLine = leadingSpaces + '// ' + line.trim()
              newLines.push(commentedLine)
              console.log(`  🔒 ${colorize(`${fieldName} ${typeName}`, 'yellow')} -> commented (${file})`)
              modified = true
            } else {
              newLines.push(line)
            }
          }
        } else {
          // Not a model type that needs processing, keep original line
          newLines.push(line)
        }
      } else {
        // Doesn't match field line format, keep original line
        newLines.push(line)
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, newLines.join('\n'))
    }
  }

  console.log(colorize('✅ Schema dependencies synced!', 'green'))
}

// Sync token.ts import based on user module state
function syncTokenImport(): void {
  console.log(colorize('\n🔄 Syncing token import...', 'cyan'))

  const tokenFilePath = path.join(projectRoot, 'src', 'lib', 'utils', 'token.ts')
  const authOptionsImport = '@/lib/auth/options'
  const placeholderImport = '@/lib/utils/file-placeholder'

  if (!fs.existsSync(tokenFilePath)) {
    console.log(colorize('  ℹ️  Token file not found, skipping', 'gray'))
    return
  }

  const content = fs.readFileSync(tokenFilePath, 'utf-8')
  const userModule = modules.find(m => m.key === 'user')
  if (!userModule) {
    console.log(colorize('  ℹ️  User module not found, skipping', 'gray'))
    return
  }

  const isUserModuleEnabled = isModuleEnabled(userModule)
  let modified = false
  let newContent = content

  if (isUserModuleEnabled) {
    // Restore: replace placeholder with auth options
    if (content.includes(placeholderImport)) {
      newContent = content.replace(new RegExp(placeholderImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), authOptionsImport)
      console.log(`  🔓 ${colorize('Restored auth options import', 'green')}`)
      modified = true
    }
  } else {
    // Delete: replace auth options with placeholder
    if (content.includes(authOptionsImport) && !content.includes(placeholderImport)) {
      newContent = content.replace(new RegExp(authOptionsImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholderImport)
      console.log(`  🔒 ${colorize('Replaced auth options with placeholder', 'yellow')}`)
      modified = true
    }
  }

  if (modified) {
    fs.writeFileSync(tokenFilePath, newContent)
    console.log(colorize('  ✅ Token import synced!', 'green'))
  } else {
    console.log(colorize('  ℹ️  Token import already in correct state', 'gray'))
  }
}

// Delete module
function deleteModule(mod: ModuleConfig): void {
  console.log(colorize(`\n📦 Deleting ${mod.name}...`, 'yellow'))
  console.log(colorize('='.repeat(60), 'gray'))

  const backupDir = path.join(projectRoot, '.modules-logs', mod.key)

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const deletedFiles: string[] = []

  // Move src files
  for (const file of mod.backupFiles.src) {
    const srcPath = path.join(projectRoot, file)
    const destPath = path.join(backupDir, file)

    if (fs.existsSync(srcPath)) {
      const destDir = path.dirname(destPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      fs.renameSync(srcPath, destPath)
      console.log(`  ✅ ${colorize(file, 'cyan')}`)
      deletedFiles.push(file)
    }
  }

  // Move prisma schema files
  for (const file of mod.backupFiles.prisma) {
    const srcPath = path.join(projectRoot, file)
    const destPath = path.join(backupDir, file)

    if (fs.existsSync(srcPath)) {
      const destDir = path.dirname(destPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      fs.renameSync(srcPath, destPath)
      console.log(`  ✅ ${colorize(file, 'cyan')}`)
      deletedFiles.push(file)
    }
  }

  // Write meta.json
  writeMeta(mod.key, {
    deletedAt: new Date().toISOString(),
    files: deletedFiles,
  })

  // Unify schema dependency handling
  syncSchemaDependencies()

  // Sync token import for user module
  if (mod.key === 'user') {
    syncTokenImport()
  }

  console.log(colorize('\n✅ Module deleted successfully!', 'green'))
  console.log(colorize(`📁 Backup location: .modules-logs/${mod.key}/`, 'cyan'))
  console.log(colorize(`\n🔄 Next, run:`, 'yellow'))
  console.log(colorize(`   npx prisma migrate dev --name delete_${mod.key}`, 'cyan'))
}

// Restore module
function restoreModule(mod: ModuleConfig): void {
  console.log(colorize(`\n🔄 Restoring ${mod.name}...`, 'yellow'))
  console.log(colorize('='.repeat(60), 'gray'))

  const backupDir = path.join(projectRoot, '.modules-logs', mod.key)
  const deletedFiles: string[] = []
  let srcRestoredCount = 0
  let prismaRestoredCount = 0
  const missingPrismaFiles: string[] = []

  // Read meta to get file list at deletion time
  const meta = readMeta(mod.key)
  if (meta?.files) {
    deletedFiles.push(...meta.files)
  }

  // Check if backup directory exists
  if (!fs.existsSync(backupDir)) {
    console.log(colorize(`\n❌ Backup directory not found: .modules-logs/${mod.key}/`, 'red'))
    console.log(colorize('   Please delete the module first before restoring.', 'yellow'))
    process.exit(1)
  }

  // Move src files
  for (const file of mod.backupFiles.src) {
    const srcPath = path.join(backupDir, file)
    const destPath = path.join(projectRoot, file)

    if (fs.existsSync(srcPath)) {
      const destDir = path.dirname(destPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      fs.renameSync(srcPath, destPath)
      console.log(`  ✅ ${colorize(file, 'cyan')}`)
      srcRestoredCount++
    }
  }

  // Move prisma schema files
  for (const file of mod.backupFiles.prisma) {
    const srcPath = path.join(backupDir, file)
    const destPath = path.join(projectRoot, file)

    if (fs.existsSync(srcPath)) {
      const destDir = path.dirname(destPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      fs.renameSync(srcPath, destPath)
      console.log(`  ✅ ${colorize(file, 'cyan')}`)
      prismaRestoredCount++
    } else {
      missingPrismaFiles.push(file)
    }
  }

  // Check for missing prisma backup files
  if (missingPrismaFiles.length > 0) {
    console.log(colorize(`\n⚠️  Warning: Missing prisma backup files:`, 'yellow'))
    for (const file of missingPrismaFiles) {
      console.log(`   - ${colorize(file, 'red')}`)
    }
    console.log(colorize('   Please manually restore these files from other sources.', 'yellow'))
  }

  // Delete meta.json
  const metaPath = path.join(backupDir, 'meta.json')
  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath)
  }

  // Clean up backup directory (delete empty directories or leftover files)
  cleanupBackupDir(backupDir)

  // Unify schema dependency handling
  syncSchemaDependencies()

  // Sync token import for user module
  if (mod.key === 'user') {
    syncTokenImport()
  }

  // Summary
  console.log(colorize('\n' + '='.repeat(60), 'gray'))
  console.log(colorize('📊 Restore Summary:', 'bright'))
  console.log(`   Src files restored: ${colorize(srcRestoredCount.toString(), 'green')}`)
  console.log(`   Prisma files restored: ${colorize(prismaRestoredCount.toString(), prismaRestoredCount > 0 ? 'green' : 'red')}`)

  if (missingPrismaFiles.length > 0) {
    console.log(colorize('\n❌ Prisma files are missing! Module may not work correctly.', 'red'))
    console.log(colorize('   You need to manually restore the missing prisma files.', 'yellow'))
  }

  console.log(colorize('\n✅ Module restore process completed!', 'green'))
  console.log(colorize('🔄 Please run `npx prisma generate` to regenerate the client', 'yellow'))
}

// Clean up backup directory
function cleanupBackupDir(backupDir: string): void {
  if (!fs.existsSync(backupDir)) return

  const entries = fs.readdirSync(backupDir, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(backupDir, entry.name)
    if (entry.isDirectory()) {
      // Recursively clean subdirectories
      cleanupBackupDir(entryPath)
    } else {
      // Delete leftover files
      fs.unlinkSync(entryPath)
    }
  }

  // Delete directory if empty
  const remaining = fs.readdirSync(backupDir)
  if (remaining.length === 0) {
    fs.rmdirSync(backupDir)
  } else {
    // Try again after deleting all subdirectories
    try {
      fs.rmdirSync(backupDir)
    } catch {
      // Directory not empty, ignore
    }
  }
}

// Show status
function showStatus(): void {
  console.log(colorize('\n📊 Module Status', 'bright'))
  console.log(colorize('='.repeat(60), 'gray'))

  for (const mod of modules) {
    const state = getModuleState(mod)
    const backedUp = isModuleBackedUp(mod)
    const meta = readMeta(mod.key)

    const statusIcon = state === 'enabled' ? '✅' : '❌'
    const statusColor = state === 'enabled' ? 'green' : 'red'
    const backedUpIcon = backedUp ? '📦' : '  '

    console.log(`\n${statusIcon} ${colorize(mod.name, statusColor)}`)
    console.log(`   ${backedUpIcon} Status: ${colorize(state === 'enabled' ? 'Enabled' : 'Disabled', statusColor)}`)

    if (backedUp && meta?.deletedAt) {
      console.log(`   📅 Deleted at: ${colorize(meta.deletedAt, 'gray')}`)
    }

    if (backedUp) {
      const backupDir = path.join(projectRoot, '.modules-logs', mod.key)
      const files = fs.readdirSync(backupDir, { recursive: true }).filter((f): f is string => typeof f === 'string')
      console.log(`   📁 Backup files: ${colorize(files.length.toString(), 'cyan')}`)
    }
  }

  console.log(colorize('\n' + '='.repeat(60), 'gray'))
}

// Interactive menu
async function interactiveMenu(): Promise<void> {
  const readline = await import('readline')
  const rl = readline.default.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve))

  async function runInteractive() {
    console.clear()
    console.log(colorize('\n🔧 Business Module Manager', 'bright'))
    console.log(colorize('='.repeat(60), 'gray'))
    console.log(colorize('\n📋 Available Operations:', 'cyan'))
    console.log('')
    console.log('  1️⃣  Delete a module')
    console.log('  2️⃣  Restore a module')
    console.log('  3️⃣  View module status')
    console.log('  0️⃣  Exit')
    console.log('')

    const choice = await question(colorize('Select operation (0-3): ', 'yellow'))

    switch (choice.trim()) {
      case '1': {
        // Delete module
        console.clear()
        console.log(colorize('\n🗑️  Delete Module', 'bright'))
        console.log(colorize('='.repeat(60), 'gray'))
        console.log(colorize('\n📦 Select a module to delete:\n', 'cyan'))

        const enabledModules = modules.filter(m => getModuleState(m) === 'enabled')
        if (enabledModules.length === 0) {
          console.log(colorize('  No modules available to delete.\n', 'yellow'))
          await new Promise(r => setTimeout(r, 1500))
          await runInteractive()
          return
        }

        enabledModules.forEach((m, i) => {
          console.log(`  ${i + 1}. ${colorize(m.name, 'green')} - ${m.description}`)
        })
        console.log('')
        const moduleChoice = await question(colorize('Enter number (0 to cancel): ', 'yellow'))
        const idx = parseInt(moduleChoice.trim()) - 1

        if (idx < 0 || idx >= enabledModules.length) {
          await runInteractive()
          return
        }

        const selectedModule = enabledModules[idx]
        console.log('')
        const confirm = await question(
          colorize(`  ⚠️  Confirm delete "${selectedModule.name}"? (y/N): `, 'yellow')
        )
        if (confirm.toLowerCase() === 'y') {
          rl.close()
          deleteModule(selectedModule)
          return
        }
        await runInteractive()
        return
      }
      case '2': {
        // Restore module
        console.clear()
        console.log(colorize('\n📦 Restore Module', 'bright'))
        console.log(colorize('='.repeat(60), 'gray'))
        console.log(colorize('\n📦 Select a module to restore:\n', 'cyan'))

        const disabledModules = modules.filter(m => getModuleState(m) === 'disabled' && isModuleBackedUp(m))
        if (disabledModules.length === 0) {
          console.log(colorize('  No modules available to restore.\n', 'yellow'))
          console.log(colorize('  (Modules must be deleted first before they can be restored)\n', 'gray'))
          await new Promise(r => setTimeout(r, 2000))
          await runInteractive()
          return
        }

        disabledModules.forEach((m, i) => {
          const meta = readMeta(m.key)
          const deletedAt = meta?.deletedAt ? new Date(meta.deletedAt).toLocaleString() : 'unknown'
          console.log(`  ${i + 1}. ${colorize(m.name, 'yellow')} - deleted at ${deletedAt}`)
        })
        console.log('')
        const moduleChoice = await question(colorize('Enter number (0 to cancel): ', 'yellow'))
        const idx = parseInt(moduleChoice.trim()) - 1

        if (idx < 0 || idx >= disabledModules.length) {
          await runInteractive()
          return
        }

        const selectedModule = disabledModules[idx]
        rl.close()
        restoreModule(selectedModule)
        return
      }
      case '3': {
        // View status
        console.clear()
        showStatus()
        console.log('')
        await question(colorize('Press Enter to continue...', 'gray'))
        await runInteractive()
        return
      }
      default:
        console.log(colorize('\n👋 Goodbye!', 'green'))
        rl.close()
        process.exit(0)
    }
  }

  await runInteractive()
}

// Main function
function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    interactiveMenu()
    return
  }

  const command = args[0]
  const moduleKey = args[1] as 'content' | 'commerce' | 'user' | undefined

  const moduleMap: Record<string, ModuleConfig> = {
    content: modules[0],
    commerce: modules[1],
    user: modules[2],
  }

  // --status: show status only
  if (command === '--status') {
    showStatus()
    return
  }

  // --delete <module>: delete module
  if (command === '--delete') {
    if (!moduleKey || !moduleMap[moduleKey]) {
      console.error(colorize('❌ Invalid module. Use: content, commerce, or user', 'red'))
      process.exit(1)
    }
    const mod = moduleMap[moduleKey]
    if (getModuleState(mod) !== 'enabled') {
      console.error(colorize(`❌ Module ${mod.name} is already disabled`, 'red'))
      process.exit(1)
    }
    deleteModule(mod)
    return
  }

  // --restore <module>: restore module
  if (command === '--restore') {
    if (!moduleKey || !moduleMap[moduleKey]) {
      console.error(colorize('❌ Invalid module. Use: content, commerce, or user', 'red'))
      process.exit(1)
    }
    const mod = moduleMap[moduleKey]
    if (getModuleState(mod) !== 'disabled') {
      console.error(colorize(`❌ Module ${mod.name} is already enabled`, 'red'))
      process.exit(1)
    }
    restoreModule(mod)
    return
  }

  // --help: show help
  if (command === '--help') {
    console.log(`
${colorize('🔧 Business Module Manager', 'bright')}

${colorize('Usage:', 'cyan')}
  tsx scripts/module-manager.ts                    # Interactive menu
  tsx scripts/module-manager.ts --status           # Show status
  tsx scripts/module-manager.ts --delete <module>  # Delete module
  tsx scripts/module-manager.ts --restore <module> # Restore module

${colorize('Modules:', 'cyan')}
  content  - Content Management (articles, pages, categories)
  commerce - Commerce (products, orders)
  user     - User Management (members)

${colorize('Examples:', 'cyan')}
  tsx scripts/module-manager.ts --delete content
  tsx scripts/module-manager.ts --restore commerce
  tsx scripts/module-manager.ts --status
`)
    return
  }

  console.error(colorize('❌ Unknown command. Use --help for usage.', 'red'))
  process.exit(1)
}

main()
