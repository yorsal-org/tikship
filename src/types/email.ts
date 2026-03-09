export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  headers?: Record<string, string>
}

export interface ReceiveEmailOptions {
  /**
   * The provider to use for receiving emails.
   */
  provider?: 'resend' | 'mailgun' | 'web'
  /**
   * The webhook payload or search criteria.
   */
  params?: Record<string, unknown>
}

export interface EmailResult {
  success: boolean
  error?: string
  id?: string
}
