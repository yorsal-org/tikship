import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SCHEMA_PATH = path.join(process.cwd(), 'prisma/schema.prisma')
const DATABASE_URL = process.env.DATABASE_URL || ''

function setupDbProvider() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error('schema.prisma not found')
    process.exit(1)
  }

  let schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
  let provider = 'postgresql' // default

  if (DATABASE_URL.startsWith('file:') || DATABASE_URL.includes('.db')) {
    provider = 'sqlite'
  } else if (DATABASE_URL.startsWith('mysql://')) {
    provider = 'mysql'
  } else if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
    provider = 'postgresql'
  }

  console.log(`Detected database provider: ${provider}`)

  // Update the provider within the datasource block
  schema = schema.replace(
    /(datasource\s+db\s+{[\s\S]*?provider\s*=\s*")([^"]*)("[\s\S]*?})/,
    `$1${provider}$3`
  )

  // Handle @db.Text annotations based on provider
  if (provider === 'sqlite') {
    // For SQLite: comment out @db.Text (SQLite doesn't support this annotation)
    console.log('Commenting out @db.Text annotations for SQLite...')
    // Only add // before @db.Text if not already commented
    schema = schema.replace(/(\s+)@db\.Text/g, (match, whitespace) => {
      // Check if this line already has // @db.Text
      const lines = schema.split('\n')
      const matchingLine = lines.find(line => line.includes(match) && !line.includes('// @db.Text'))
      return matchingLine ? `${whitespace}// @db.Text` : match
    })
  } else {
    // For MySQL/PostgreSQL: uncomment @db.Text
    console.log('Enabling @db.Text annotations for MySQL/PostgreSQL...')
    // Remove // before @db.Text
    schema = schema.replace(/(\s+)\/\/\s*@db\.Text/g, '$1@db.Text')
  }

  fs.writeFileSync(SCHEMA_PATH, schema)
  console.log(`Successfully updated schema.prisma provider to: ${provider}`)
}

try {
  setupDbProvider()
} catch (error) {
  console.error('Failed to setup database provider:', error)
  process.exit(1)
}
