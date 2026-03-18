import { siteConfig } from '@/config/site'

/**
 * Generate plain text version of verification code email
 */
export function verificationCodePlainText(code: string): string {
  const currentYear = new Date().getFullYear()
  return `
${siteConfig.name} - Email Verification

Hello!

Thank you for registering with ${siteConfig.name}. Please use the following verification code to complete your registration:

Verification Code: ${code}

Important Notice:
- This code will expire in 10 minutes
- Do not share this code with anyone
- If you did not request this email, please ignore it

This email was sent automatically, please do not reply

© ${currentYear} ${siteConfig.name}. All rights reserved.
  `.trim()
}
