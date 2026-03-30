import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/service'
import { verificationCodePlainText } from '@/lib/email/templates-verification'
import { getDefaultSiteName } from '@/lib/i18n/site'

/**
 * Check if email sending is rate limited
 */
async function checkRateLimit(email: string): Promise<{
  allowed: boolean
  error?: 'RATE_LIMIT_MINUTE' | 'RATE_LIMIT_DAY'
}> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Check 1 minute rate limit
  const recentCount = await prisma.emailVerificationCode.count({
    where: {
      email,
      createdAt: {
        gte: oneMinuteAgo,
      },
    },
  })

  if (recentCount > 0) {
    return {
      allowed: false,
      error: 'RATE_LIMIT_MINUTE',
    }
  }

  // Check daily limit (5 times per day)
  const dailyCount = await prisma.emailVerificationCode.count({
    where: {
      email,
      createdAt: {
        gte: oneDayAgo,
      },
    },
  })

  if (dailyCount >= 5) {
    return {
      allowed: false,
      error: 'RATE_LIMIT_DAY',
    }
  }

  return { allowed: true }
}

/**
 * Generate 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send verification code email
 */
export async function sendVerificationCode(
  email: string,
  type: 'REGISTER' | 'RESET_PASSWORD' = 'REGISTER'
): Promise<{
  success: boolean
  error?: 'RATE_LIMIT_MINUTE' | 'RATE_LIMIT_DAY' | 'SEND_FAILED'
}> {
  try {
    // Check rate limit
    const rateLimitCheck = await checkRateLimit(email)
    if (!rateLimitCheck.allowed) {
      return { success: false, error: rateLimitCheck.error }
    }

    // Generate verification code
    const code = generateVerificationCode()

    // Save to database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      },
    })

    // Send email via core service
    const siteName = getDefaultSiteName()
    const subject =
      type === 'REGISTER' ? `[${siteName}] Verification Code` : `[${siteName}] Password Reset Code`

    const result = await sendEmail({
      to: email,
      subject,
      text: verificationCodePlainText(code),
    })

    if (!result.success) {
      return { success: false, error: 'SEND_FAILED' }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send verification code:', error)
    return { success: false, error: 'SEND_FAILED' }
  }
}

/**
 * Verify verification code
 */
export async function verifyVerificationCode(
  email: string,
  code: string,
  type: 'REGISTER' | 'RESET_PASSWORD' = 'REGISTER'
): Promise<{
  valid: boolean
  error?: 'CODE_NOT_FOUND' | 'TOO_MANY_ATTEMPTS' | 'CODE_INVALID' | 'VERIFY_FAILED'
}> {
  try {
    // Find the most recent verification code
    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        email,
        type,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verification) {
      return { valid: false, error: 'CODE_NOT_FOUND' }
    }

    // Check attempts (max 5 attempts)
    if (verification.attempts >= 5) {
      return { valid: false, error: 'TOO_MANY_ATTEMPTS' }
    }

    // Increment attempts
    await prisma.emailVerificationCode.update({
      where: { id: verification.id },
      data: { attempts: verification.attempts + 1 },
    })

    // Verify code
    if (verification.code !== code) {
      return { valid: false, error: 'CODE_INVALID' }
    }

    // Delete used verification code
    await prisma.emailVerificationCode.delete({
      where: { id: verification.id },
    })

    return { valid: true }
  } catch (error) {
    console.error('Failed to verify code:', error)
    return { valid: false, error: 'VERIFY_FAILED' }
  }
}

/**
 * Clean up expired verification codes
 */
export async function cleanupExpiredCodes(): Promise<void> {
  await prisma.emailVerificationCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
}
