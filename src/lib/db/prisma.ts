import { PrismaClient } from '../../../prisma/generated/client'

const DATABASE_URL = process.env.DATABASE_URL || ''

const getAdapter = async () => {
  if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
    const [{ PrismaPg }, { Pool }] = await Promise.all([import('@prisma/adapter-pg'), import('pg')])
    const pool = new Pool({ connectionString: DATABASE_URL })
    return new PrismaPg(pool)
  }

  if (DATABASE_URL.startsWith('mysql://')) {
    const { PrismaMariaDb } = await import('@prisma/adapter-mariadb')
    return new PrismaMariaDb(DATABASE_URL)
  }

  if (DATABASE_URL.startsWith('file:') || DATABASE_URL.includes('.db')) {
    const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3')
    const sqlitePath = DATABASE_URL.startsWith('file:')
      ? DATABASE_URL.replace('file:', '')
      : DATABASE_URL
    return new PrismaBetterSqlite3({ url: sqlitePath })
  }

  return null
}

const adapter = await getAdapter()

const prismaOptions = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  ...(adapter && { adapter }),
} as const

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions as never)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
