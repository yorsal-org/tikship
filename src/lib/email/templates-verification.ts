import { getDefaultSiteName } from '@/lib/i18n/site'

/**
 * Generate plain text version of verification code email
 */
export function verificationCodePlainText(code: string): string {
  const currentYear = new Date().getFullYear()
  const siteName = getDefaultSiteName()
  return `
${siteName} - Email Verification

Hello!

Thank you for registering with ${siteName}. Please use the following verification code to complete your registration:

Verification Code: ${code}

Important Notice:
- This code will expire in 10 minutes
- Do not share this code with anyone
- If you did not request this email, please ignore it

This email was sent automatically, please do not reply

© ${currentYear} ${siteName}. All rights reserved.
  `.trim()
}
