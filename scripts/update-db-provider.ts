import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const MODELS_DIR = path.join(process.cwd(), 'prisma/models')
const DATABASE_URL = process.env.DATABASE_URL || ''

function getDatabaseProvider(): string {
  if (DATABASE_URL.startsWith('file:') || DATABASE_URL.includes('.db')) {
    return 'sqlite'
  } else if (DATABASE_URL.startsWith('mysql://')) {
    return 'mysql'
  } else if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
    return 'postgresql'
  }
  return 'postgresql'
}

function getPrismaFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`)
    return []
  }

  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.prisma'))
    .map(file => path.join(dir, file))
}

function processPrismaFile(filePath: string, provider: string) {
  let content = fs.readFileSync(filePath, 'utf8')
  const fileName = path.basename(filePath)

  // Update the provider within the datasource block
  content = content.replace(
    /(datasource\s+db\s+{[\s\S]*?provider\s*=\s*")([^"]*)("[\s\S]*?})/,
    `$1${provider}$3`
  )

  // Handle @db.Text annotations based on provider
  if (provider === 'sqlite') {
    // For SQLite: comment out @db.Text (SQLite doesn't support this annotation)
    console.log(`Commenting out @db.Text annotations in ${fileName}...`)
    // Only add // before @db.Text if not already commented
    content = content.replace(/(\s+)@db\.Text/g, (match, whitespace) => {
      // Check if this line already has // @db.Text
      const lines = content.split('\n')
      const matchingLine = lines.find(line => line.includes(match) && !line.includes('// @db.Text'))
      return matchingLine ? `${whitespace}// @db.Text` : match
    })
  } else {
    // For MySQL/PostgreSQL: uncomment @db.Text
    console.log(`Enabling @db.Text annotations in ${fileName}...`)
    // Remove // before @db.Text
    content = content.replace(/(\s+)\/\/\s*@db\.Text/g, '$1@db.Text')
  }

  fs.writeFileSync(filePath, content)
  console.log(`Successfully updated ${fileName} provider to: ${provider}`)
}

function setupDbProvider() {
  const files = getPrismaFiles(MODELS_DIR)

  if (files.length === 0) {
    console.error('No .prisma files found in prisma/models/')
    process.exit(1)
  }

  const provider = getDatabaseProvider()
  console.log(`Detected database provider: ${provider}`)
  console.log(`Found ${files.length} .prisma files to process\n`)

  for (const file of files) {
    processPrismaFile(file, provider)
  }

  console.log(`\nSuccessfully updated all ${files.length} prisma files`)
}

try {
  setupDbProvider()
} catch (error) {
  console.error('Failed to setup database provider:', error)
  process.exit(1)
}
