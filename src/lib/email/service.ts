import { Resend } from 'resend'
import Mailgun from 'mailgun.js'
import formData from 'form-data'
import { SendEmailOptions, ReceiveEmailOptions, EmailResult } from '@/types/email'
import { siteConfig } from '@/config/site'

// Initialize resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Initialize Mailgun
const mailgun = new Mailgun(formData)
const mg = process.env.MAILGUN_API_KEY
  ? mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    })
  : null

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend' // 'resend' or 'mailgun'

/**
 * Send email using Resend
 */
async function sendEmailWithResend(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, html, text, from, replyTo, cc, bcc, headers } = options

    const fromAddress =
      from || process.env.RESEND_FROM_EMAIL || `noreply@${siteConfig.supportEmail.split('@')[1]}`

    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html: html || '',
      text: text || '',
      replyTo,
      cc,
      bcc,
      headers,
    })

    if (result.error) {
      console.error('Email send error:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email using Mailgun
 */
async function sendEmailWithMailgun(options: SendEmailOptions): Promise<EmailResult> {
  try {
    if (!mg) {
      return { success: false, error: 'Mailgun is not configured' }
    }

    const domain = process.env.MAILGUN_DOMAIN
    if (!domain) {
      return { success: false, error: 'Mailgun domain is not configured' }
    }

    const { to, subject, html, text, from, replyTo, cc, bcc, headers } = options

    const fromAddress =
      from || process.env.MAILGUN_FROM_EMAIL || `noreply@${siteConfig.supportEmail.split('@')[1]}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageData: any = {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || '',
      text: text || '',
    }

    if (replyTo) {
      messageData['h:Reply-To'] = replyTo
    }

    if (cc) {
      messageData.cc = Array.isArray(cc) ? cc : [cc]
    }

    if (bcc) {
      messageData.bcc = Array.isArray(bcc) ? bcc : [bcc]
    }

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        messageData[`h:${key}`] = value
      })
    }

    const result = await mg.messages.create(domain, messageData)

    return { success: true, id: result.id }
  } catch (error) {
    console.error('Failed to send email with Mailgun:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email using configured provider
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  if (EMAIL_PROVIDER === 'mailgun') {
    return sendEmailWithMailgun(options)
  }
  return sendEmailWithResend(options)
}

/**
 * Handle receiving emails (placeholder for structure)
 * In a real-world scenario, this might process webhooks or poll an inbox.
 */
export async function receiveEmail(options: ReceiveEmailOptions): Promise<{
  success: boolean
  message: string
}> {
  // TODO: Implement according to specific provider requirements (e.g. Resend webhooks)
  console.log('receiveEmail called with options:', options)
  return {
    success: true,
    message: 'Receive logic structure defined; implementation pending provider setup.',
  }
}
