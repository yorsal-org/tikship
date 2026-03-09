#!/usr/bin/env tsx

/**
 * Environment Configuration Setup Script
 *
 * This script helps users configure their environment variables by:
 * 1. Reading from .env if it exists, otherwise from .env.example
 * 2. Displaying all current values in a global view
 * 3. Allowing selection and modification of specific variables
 * 4. Saving the configuration to .env or quitting without saving
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths
const rootDir = path.join(__dirname, '..')
const envPath = path.join(rootDir, '.env')
const envExamplePath = path.join(rootDir, '.env.example')

// ANSI color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
}

interface CommentEntry {
  type: 'comment'
  content: string
  lineNumber: number
}

interface VariableEntry {
  type: 'variable'
  key: string
  value: string
  originalLine: string
  lineNumber: number
  index?: number // For display numbering
  hints?: string[] // Collected comment hints for this variable
}

interface UnknownEntry {
  type: 'unknown'
  content: string
  lineNumber: number
}

type Entry = CommentEntry | VariableEntry | UnknownEntry

/**
 * Read environment file and parse it into key-value pairs
 * Preserves comments and empty lines
 * Collects consecutive ## comment lines before each variable as hints
 * Single # comments are treated as section headers
 */
function readEnvFile(filePath: string): Entry[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const entries: Entry[] = []
  let pendingComments: string[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Handle comments
    if (trimmed.startsWith('#')) {
      entries.push({ type: 'comment', content: line, lineNumber: index })

      // ## comments are descriptions/hints for the next variable
      if (trimmed.startsWith('##')) {
        const comment = trimmed.replace(/^##\s*/, '')
        if (comment) {
          pendingComments.push(comment)
        }
      }
      // Single # comments are section headers, don't collect as hints

      return
    }

    // Empty lines don't reset pending comments (allow spacing between hints and variables)
    if (trimmed === '') {
      entries.push({ type: 'comment', content: line, lineNumber: index })
      return
    }

    // Parse key-value pairs
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      entries.push({
        type: 'variable',
        key,
        value,
        originalLine: line,
        lineNumber: index,
        hints: pendingComments.length > 0 ? [...pendingComments] : undefined,
      })

      // Reset pending comments after attaching to variable
      pendingComments = []
    } else {
      // Unknown format, preserve as-is
      entries.push({ type: 'unknown', content: line, lineNumber: index })
      pendingComments = []
    }
  })

  return entries
}

/**
 * Write entries back to .env file
 */
function writeEnvFile(entries: Entry[]): void {
  const lines = entries.map(entry => {
    if (entry.type === 'variable') {
      // Wrap value in quotes if it contains spaces or special characters
      const needsQuotes = /[\s#]/.test(entry.value) || entry.value === ''
      const quotedValue = needsQuotes ? `"${entry.value}"` : entry.value
      return `${entry.key}=${quotedValue}`
    }
    return entry.content
  })

  fs.writeFileSync(envPath, lines.join('\n'), 'utf-8')
}

/**
 * Create readline interface for user input
 */
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

/**
 * Prompt user for input
 */
function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      resolve(answer.trim())
    })
  })
}

/**
 * Display the global view of all environment variables
 */
function displayGlobalView(entries: Entry[]): VariableEntry[] {
  console.clear()
  console.log(`${colors.bright}${colors.green}╔${'═'.repeat(78)}╗${colors.reset}`)
  console.log(
    `${colors.bright}${colors.green}║${' '.repeat(20)}Environment Configuration Setup${' '.repeat(26)}║${colors.reset}`
  )
  console.log(`${colors.bright}${colors.green}╚${'═'.repeat(78)}╝${colors.reset}\n`)

  const variables: VariableEntry[] = []
  let variableIndex = 1
  let currentSection = ''
  let lastWasVariable = false

  entries.forEach((entry, idx) => {
    // Display section headers (single # comments)
    if (
      entry.type === 'comment' &&
      entry.content.trim().startsWith('#') &&
      !entry.content.trim().startsWith('##')
    ) {
      const comment = entry.content.trim().replace(/^#\s*/, '')

      // Only show as section header if:
      // 1. It's not empty
      // 2. It's different from current section
      // 3. It's followed by a variable or another meaningful comment (not just decorative)
      if (comment && comment !== currentSection) {
        // Look ahead to see if this is a meaningful section header
        const nextEntries = entries.slice(idx + 1, idx + 5)
        const hasVariableAhead = nextEntries.some(e => e.type === 'variable')

        if (hasVariableAhead || lastWasVariable) {
          currentSection = comment
          console.log(`\n${colors.bright}${colors.cyan}▶ ${comment}${colors.reset}`)
          console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`)
          lastWasVariable = false
        }
      }
    }

    // Display variables with index
    if (entry.type === 'variable') {
      entry.index = variableIndex
      variables.push(entry)

      const indexStr = `[${variableIndex}]`.padEnd(5)
      const keyStr = entry.key.padEnd(25)
      const rawValue = entry.value.length > 40 ? entry.value.substring(0, 37) + '...' : entry.value
      const valueDisplay = entry.value ? `"${rawValue}"` : `${colors.dim}(empty)${colors.reset}`
      const valueStr = entry.value ? `${colors.green}${valueDisplay}${colors.reset}` : valueDisplay

      console.log(
        `  ${colors.yellow}${indexStr}${colors.reset}${colors.bright}${keyStr}${colors.reset} ${valueStr}`
      )

      variableIndex++
      lastWasVariable = true
    }
  })

  console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`)
  console.log(`${colors.cyan}Total: ${variables.length} variables${colors.reset}\n`)

  return variables
}

/**
 * Display help menu
 */
function displayHelp(showQuit: boolean = true): void {
  console.log(`\n${colors.bright}${colors.magenta}Available Commands:${colors.reset}`)
  console.log(`  ${colors.yellow}[number]${colors.reset}  - Edit variable by index`)
  console.log(`  ${colors.yellow}s, save${colors.reset}   - Save changes to .env`)
  if (showQuit) {
    console.log(`  ${colors.yellow}q, quit${colors.reset}   - Quit without saving`)
  }
  console.log(`  ${colors.yellow}v, view${colors.reset}   - Refresh view`)
  console.log(`  ${colors.yellow}h, help${colors.reset}   - Show this help\n`)
}

/**
 * Specialized setup for DATABASE_URL
 */
async function setupDatabaseUrl(rl: readline.Interface): Promise<string> {
  console.log(`\n${colors.bright}${colors.magenta}Database Selection:${colors.reset}`)
  console.log(`  ${colors.yellow}[1]${colors.reset} MySQL`)
  console.log(`  ${colors.yellow}[2]${colors.reset} SQLite`)
  console.log(`  ${colors.yellow}[3]${colors.reset} PostgreSQL`)
  console.log(`  ${colors.yellow}[q]${colors.reset} Cancel / Go back`)

  const choice = await question(
    rl,
    `\n${colors.bright}Select database type (1-3) or 'q' to cancel:${colors.reset} `
  )

  if (choice.toLowerCase() === 'q') {
    return ''
  }

  if (choice === '1') {
    // MySQL
    const host = (await question(rl, `  Host (default: localhost): `)) || 'localhost'
    const port = (await question(rl, `  Port (default: 3306): `)) || '3306'
    const dbName = (await question(rl, `  Database (default: tikship): `)) || 'tikship'
    const user = (await question(rl, `  Username (default: root): `)) || 'root'
    const password = await question(rl, `  Password: `)
    return `mysql://${user}:${password}@${host}:${port}/${dbName}`
  } else if (choice === '2') {
    // SQLite
    const path = (await question(rl, `  File Path (default: ./dev.db): `)) || './dev.db'
    return `file:${path}`
  } else if (choice === '3') {
    // PostgreSQL
    const host = (await question(rl, `  Host (default: localhost): `)) || 'localhost'
    const port = (await question(rl, `  Port (default: 5432): `)) || '5432'
    const dbName = (await question(rl, `  Database (default: tikship): `)) || 'tikship'
    const user = await question(rl, `  Username: `)
    const password = await question(rl, `  Password: `)
    const schema = (await question(rl, `  Schema (default: public): `)) || 'public'
    return `postgresql://${user}:${password}@${host}:${port}/${dbName}?schema=${schema}`
  }

  console.log(`${colors.red}Invalid choice. Cancelled.${colors.reset}`)
  return ''
}

/**
 * Edit a specific variable
 */
async function editVariable(rl: readline.Interface, variable: VariableEntry): Promise<void> {
  console.log(`\n${colors.bright}${colors.cyan}Editing: ${variable.key}${colors.reset}`)

  // Display merged hints if available
  if (variable.hints && variable.hints.length > 0) {
    const mergedHint = variable.hints.join(' ')
    console.log(`${colors.dim}💡 ${mergedHint}${colors.reset}`)
  }

  console.log(`${colors.dim}Current value: ${variable.value || '(empty)'}${colors.reset}`)

  let newValue: string
  if (variable.key === 'DATABASE_URL') {
    newValue = await setupDatabaseUrl(rl)
  } else {
    newValue = await question(
      rl,
      `${colors.yellow}New value${colors.reset} (press Enter to keep current): `
    )
  }

  if (newValue !== '') {
    variable.value = newValue
    console.log(`${colors.green}✓ Updated${colors.reset}`)
  } else {
    console.log(`${colors.dim}No change${colors.reset}`)
  }
}

/**
 * Main interactive setup function
 */
async function setupEnvironment(): Promise<void> {
  // Determine source file
  let sourceFile: string
  let isNewEnv = false

  if (fs.existsSync(envPath)) {
    sourceFile = envPath
  } else if (fs.existsSync(envExamplePath)) {
    sourceFile = envExamplePath
    isNewEnv = true
  } else {
    console.error(`${colors.red}Error: Neither .env nor .env.example found!${colors.reset}`)
    process.exit(1)
  }

  // Read and parse the file
  const entries = readEnvFile(sourceFile)
  const rl = createInterface()

  let running = true
  let hasChanges = false

  // Track the DATABASE_URL at the start or last save to detect changes
  const getDbUrl = () =>
    (
      entries.find(e => e.type === 'variable' && e.key === 'DATABASE_URL') as
        | VariableEntry
        | undefined
    )?.value || ''
  let lastSavedDbUrl = getDbUrl()

  while (running) {
    // Display global view
    const variables = displayGlobalView(entries)

    // Show source file info
    if (isNewEnv) {
      console.log(
        `${colors.yellow}⚠ Using .env.example as template (no .env file found)${colors.reset}`
      )
    } else {
      console.log(`${colors.blue}ℹ Editing existing .env file${colors.reset}`)
    }

    if (hasChanges) {
      console.log(`${colors.green}✓ Unsaved changes${colors.reset}`)
    }

    displayHelp(!isNewEnv)

    // Get user command
    const command = await question(rl, `${colors.bright}Enter command:${colors.reset} `)

    const cmd = command.toLowerCase()

    // Handle commands
    if (cmd === 'q' || cmd === 'quit') {
      if (isNewEnv) {
        console.log(
          `${colors.red}Error: You must save the configuration at least once to create the .env file.${colors.reset}`
        )
        continue
      }

      if (hasChanges) {
        const confirm = await question(
          rl,
          `${colors.yellow}You have unsaved changes. Quit anyway? (y/n):${colors.reset} `
        )
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
          running = false
        }
      } else {
        running = false
      }
    } else if (cmd === 's' || cmd === 'save') {
      writeEnvFile(entries)
      console.log(`\n${colors.green}${colors.bright}✓ Configuration saved to .env${colors.reset}`)

      // Check if DATABASE_URL was changed since last save
      const currentDbUrl = getDbUrl()
      if (currentDbUrl !== lastSavedDbUrl) {
        console.log(
          `\n${colors.bright}${colors.cyan}Detected DATABASE_URL change. Updating database client...${colors.reset}`
        )
        try {
          console.log(`${colors.dim}Running: npm run db:generate...${colors.reset}`)
          execSync('npm run db:generate', { stdio: 'inherit', cwd: rootDir })
          console.log(
            `\n${colors.green}${colors.bright}✓ Database client successfully updated!${colors.reset}`
          )
          lastSavedDbUrl = currentDbUrl // Update for next comparison
        } catch (error) {
          console.error(`\n${colors.red}Error updating database client: ${error}${colors.reset}`)
        }
      }

      if (isNewEnv) {
        console.log(
          `${colors.yellow}⚠ Remember to update sensitive values like secrets and passwords!${colors.reset}`
        )
      }

      hasChanges = false
      running = false // Auto-quit after save
    } else if (cmd === 'v' || cmd === 'view') {
      // Just refresh the view (loop will continue)
      continue
    } else if (cmd === 'h' || cmd === 'help') {
      displayHelp()
    } else {
      // Try to parse as a number
      const index = parseInt(command, 10)
      if (!isNaN(index) && index >= 1 && index <= variables.length) {
        const variable = variables[index - 1]
        await editVariable(rl, variable)
        hasChanges = true
      } else {
        console.log(`${colors.red}Invalid command. Type 'h' for help.${colors.reset}`)
      }
    }
  }

  rl.close()
  console.log(`\n${colors.cyan}Goodbye!${colors.reset}\n`)
}

// Run the setup
setupEnvironment().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`)
  process.exit(1)
})
