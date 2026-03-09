/**
 * Script to reset administrator password
 * Usage: npx tsx scripts/reset-admin-password.ts <username> <new_password>
 */

import 'dotenv/config'
import { prisma } from '../src/lib/db/prisma'
import { hashPassword } from '../src/lib/auth/password'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

async function main() {
  const args = process.argv.slice(2)
  let username = args[0]
  let newPassword = args[1]

  if (!username || !newPassword) {
    const rl = createInterface({ input, output })

    if (!username) {
      username = await rl.question('Enter administrator username: ')
    }

    if (!newPassword) {
      newPassword = await rl.question('Enter new password: ')
    }

    rl.close()
  }

  if (!username || !newPassword) {
    console.error('❌ Username and password are required.')
    process.exit(1)
  }

  console.log(`🔍 Searching for admin user: ${username}...`)

  const user = await prisma.adminUser.findUnique({
    where: { username },
  })

  if (!user) {
    console.error(`❌ User '${username}' not found.`)
    process.exit(1)
  }

  console.log(`🔐 Hashing new password...`)
  const hashedPassword = await hashPassword(newPassword)

  console.log(`📝 Updating password in database...`)
  await prisma.adminUser.update({
    where: { username },
    data: {
      password: hashedPassword,
    },
  })

  console.log(`✅ Successfully updated password for user '${username}'.`)
}

main()
  .catch(e => {
    console.error('❌ Error updating password:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
