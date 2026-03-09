export interface CreateCheckoutSessionRequest {
  items: CheckoutItem[]
  successUrl?: string
  cancelUrl?: string
  customerId?: string
  mode?: 'payment' | 'subscription'
  metadata?: Record<string, string>
}

export interface CheckoutItem {
  priceId: string
  quantity: number
}

export interface StripeSessionResponse {
  sessionId: string
  url: string | null
}

export interface WebhookResponse {
  received: boolean
}
