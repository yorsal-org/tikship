#!/usr/bin/env tsx

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
const nodeModulesPath = path.join(rootDir, 'node_modules')
const schemaPath = path.join(rootDir, 'prisma/models/schema.prisma')

// ANSI color codes
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
  white: '\x1b[37m',
}

/**
 * Get database provider from schema.prisma
 */
function getDatabaseProvider(): string {
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
    const providerMatch = schemaContent.match(/datasource\s+db\s*\{[^}]*provider\s*=\s*"([^"]+)"/)
    if (providerMatch && providerMatch[1]) {
      return providerMatch[1].toLowerCase()
    }
  } catch {
    console.log(
      `${colors.yellow}⚠ Could not read schema.prisma, defaulting to postgresql${colors.reset}`
    )
  }
  return 'postgresql'
}

/**
 * Get migrations path based on database provider
 */
function getMigrationsPath(): string {
  const provider = getDatabaseProvider()
  return path.join(rootDir, `prisma/migrations-${provider}`)
}

/**
 * Display the Tikship ASCII logo
 */
function displayLogo() {
  console.log(`${colors.cyan}${colors.bright}`)
  console.log('  ████████╗██╗██╗  ██╗███████╗██╗  ██╗██╗██████╗ ')
  console.log('  ╚══██╔══╝██║██║ ██╔╝██╔════╝██║  ██║██║██╔══██╗')
  console.log('     ██║   ██║█████╔╝ ███████╗███████║██║██████╔╝')
  console.log('     ██║   ██║██╔═██╗ ╚════██║██╔══██║██║██╔═══╝ ')
  console.log('     ██║   ██║██║  ██╗███████║██║  ██║██║██║     ')
  console.log('     ╚═╝   ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ')
  console.log(`${colors.reset}`)
  console.log(
    `${colors.green}${colors.bright}  Welcome to Tikship Installation Tool${colors.reset}\n`
  )
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
 * Execute a command and display progress
 */
function runCommand(command: string, description: string) {
  console.log(`\n${colors.cyan}➜ ${description}${colors.reset}`)
  console.log(`${colors.dim}Running: ${command}${colors.reset}`)
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir })
    console.log(`${colors.green}✓ Success: ${description}${colors.reset}`)
    return true
  } catch {
    console.error(`\n${colors.red}✗ Error during: ${description}${colors.reset}`)
    return false
  }
}

/**
 * Main installation flow
 */
async function install() {
  console.clear()
  displayLogo()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // Handle Ctrl+C (SIGINT)
  process.on('SIGINT', () => {
    console.log(`\n\n${colors.yellow}⚠ Installation cancelled by user.${colors.reset}\n`)
    rl.close()
    process.exit(130)
  })

  const results = {
    deps: 'Exists',
    env: 'Skipped',
    db: 'Skipped',
    build: 'Skipped',
    adminUser: '',
    adminPass: '',
  }

  try {
    // 0. Check dependencies
    console.log(`\n${colors.bright}${colors.blue}Step 0: Dependency Check${colors.reset}`)
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(
        `${colors.yellow}⚠ node_modules not found. Installing dependencies...${colors.reset}`
      )
      if (runCommand('npm install', 'Installing dependencies')) {
        results.deps = 'Success'
      } else {
        results.deps = 'Failed'
        throw new Error('Dependency installation failed')
      }
    } else {
      console.log(`${colors.green}✓ node_modules already exists.${colors.reset}`)
    }
    // 1. Check environment variables
    console.log(
      `\n${colors.bright}${colors.blue}Step 1: Environment Variables Initialization${colors.reset}`
    )
    if (!fs.existsSync(envPath)) {
      console.log(
        `${colors.yellow}⚠ Environment file (.env) not found. Setting up automatically...${colors.reset}`
      )
      if (runCommand('npm run setup:env', 'Setting up environment variables')) {
        results.env = 'Success'
      } else {
        results.env = 'Failed'
      }
    } else {
      console.log(`${colors.green}✓ Environment file (.env) already exists.${colors.reset}`)
      results.env = 'Exists'
    }

    // 2. Database Initialization
    console.log(`\n${colors.bright}${colors.blue}Step 2: Database Initialization${colors.reset}`)
    const provider = getDatabaseProvider()
    const migrationsPath = getMigrationsPath()
    console.log(`${colors.dim}Detected database provider: ${provider}${colors.reset}`)
    console.log(`${colors.dim}Using migrations path: ${migrationsPath}${colors.reset}`)

    let dbSuccess = true
    if (!runCommand('npm run db:generate', 'Generating Prisma Client')) {
      dbSuccess = false
    }

    if (dbSuccess) {
      if (fs.existsSync(migrationsPath)) {
        if (!runCommand('npx prisma migrate deploy', 'Deploying database migrations')) {
          dbSuccess = false
        }
      } else {
        console.log(
          `${colors.yellow}ℹ Migrations directory not found at ${migrationsPath}. Initializing database schema with db push...${colors.reset}`
        )
        if (!runCommand('npx prisma db push --accept-data-loss', 'Pushing database schema')) {
          dbSuccess = false
        }
      }
    }

    if (dbSuccess) {
      // Run seed directly as a function
      console.log(`\n${colors.cyan}➜ Seeding initial data${colors.reset}`)
      try {
        const { seed } = await import('./seed')
        const credentials = await seed()

        results.adminUser = credentials.adminUsername
        results.adminPass = credentials.adminPassword

        results.db = 'Success'
        console.log(`${colors.green}✓ Success: Seeding initial data${colors.reset}`)
      } catch {
        console.log(`${colors.yellow}⚠ Warning: Seeding failed or was empty.${colors.reset}`)
        results.db = 'Success (No Seed)'
      }
    } else {
      results.db = 'Failed'
      throw new Error('Database initialization failed')
    }

    // 3. Project Build
    console.log(`\n${colors.bright}${colors.blue}Step 3: Build Project${colors.reset}`)

    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

    if (isDev) {
      console.log(
        `${colors.yellow}ℹ Running in development environment. Skipping project build...${colors.reset}`
      )
      results.build = 'Skipped (Dev)'
    } else {
      const buildProject = await question(rl, `Do you want to build the project now? (y/n) [n]: `)

      if (buildProject.toLowerCase() === 'y') {
        if (runCommand('npm run build', 'Building project')) {
          results.build = 'Success'
        } else {
          console.log(
            `${colors.yellow}⚠ Build failed. You can try running "npm run build" later.${colors.reset}`
          )
          results.build = 'Failed'
        }
      }
    }

    // Final Summary
    console.log(
      `\n${colors.magenta}${colors.bright}==========================================${colors.reset}`
    )
    console.log(
      `${colors.magenta}${colors.bright}          INSTALLATION SUMMARY            ${colors.reset}`
    )
    console.log(
      `${colors.magenta}${colors.bright}==========================================${colors.reset}`
    )
    console.log(
      `${colors.cyan}Dependencies:     ${getStatusColor(results.deps)}${results.deps}${colors.reset}`
    )
    console.log(
      `${colors.cyan}Environment Setup: ${getStatusColor(results.env)}${results.env}${colors.reset}`
    )
    console.log(
      `${colors.cyan}Database Init:     ${getStatusColor(results.db)}${results.db}${colors.reset}`
    )
    console.log(
      `${colors.cyan}Project Build:     ${getStatusColor(results.build)}${results.build}${colors.reset}`
    )

    if (results.adminUser && results.adminPass) {
      console.log(
        `${colors.magenta}${colors.bright}------------------------------------------${colors.reset}`
      )
      console.log(`${colors.yellow}${colors.bright}Admin Credentials:${colors.reset}`)
      console.log(
        `${colors.cyan}Username:          ${colors.white}${results.adminUser}${colors.reset}`
      )
      console.log(
        `${colors.cyan}Password:          ${colors.white}${results.adminPass}${colors.reset}`
      )
      console.log(
        `${colors.yellow}${colors.dim}⚠️  Please change your password after login!${colors.reset}`
      )
    }

    console.log(
      `${colors.magenta}${colors.bright}==========================================${colors.reset}`
    )

    console.log(`\n${colors.green}${colors.bright}✨ Installation Complete! ✨${colors.reset}`)
    console.log(`\nYou can now start the development server with:`)
    console.log(`${colors.cyan}  npm run dev${colors.reset}\n`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`\n${colors.red}${colors.bright}Installation failed: ${message}${colors.reset}`)
  } finally {
    rl.close()
  }
}

/**
 * Helper to get status color
 */
function getStatusColor(status: string) {
  switch (status) {
    case 'Success':
    case 'Exists':
      return colors.green
    case 'Failed':
      return colors.red
    case 'Skipped':
    case 'Skipped (Dev)':
      return colors.yellow
    default:
      return colors.reset
  }
}

// Run the installation
install().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error(`${colors.red}Unexpected Error: ${message}${colors.reset}`)
  process.exit(1)
})
