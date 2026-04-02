import { prisma } from '@/lib/db/prisma'
import { getDefaultSiteName } from '@/lib/i18n/site'
import { getModuleState } from '@/lib/module-state'

export interface CreatePayPalOrderRequest {
  productId: string
  quantity?: number
  userId?: string
  successUrl?: string
  cancelUrl?: string
}

export interface CreatePayPalSubscriptionRequest {
  planId: string
  userId?: string
  successUrl?: string
  cancelUrl?: string
}

export class PayPalService {
  private baseUrl: string
  private clientId: string
  private clientSecret: string

  constructor() {
    this.baseUrl =
      process.env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com'
    this.clientId = process.env.PAYPAL_CLIENT_ID || ''
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
  }

  /**
   * Get user include clause based on module state
   */
  private getUserInclude() {
    const moduleState = getModuleState()
    return moduleState.user ? {
      user: {
        select: { id: true, name: true, email: true },
      },
    } : {}
  }

  /**
   * Get typed user from order if available
   */
  private getUser(order: { user?: { id: string; name: string | null; email: string | null } | null }) {
    const moduleState = getModuleState()
    if (moduleState.user && order.user) {
      return order.user as { id: string; name: string | null; email: string | null }
    }
    return null
  }

  /**
   * Decrease product quantity if it has stock limit
   */
  private async decreaseProductQuantity(productId: string, quantity: number | null) {
    if (quantity !== null && quantity !== undefined) {
      const newQuantity = Math.max(0, quantity - 1)
      await prisma.product.update({
        where: { id: productId },
        data: { quantity: newQuantity },
      })
      console.log(`Product ${productId} quantity decreased to ${newQuantity}`)
    }
  }

  /**
   * Get PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token')
    }

    const data = await response.json()
    return data.access_token
  }

  /**
   * Create a PayPal order for one-time payment
   */
  async createOrder(data: CreatePayPalOrderRequest) {
    const { productId, quantity = 1, userId, successUrl, cancelUrl } = data

    // Get product from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        paymentMethods: {
          where: {
            provider: 'paypal',
            mode: 'payment',
            isActive: true,
          },
        },
      },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    if (!product.isActive) {
      throw new Error('Product is not active')
    }

    // Check stock availability
    if (product.quantity !== null && product.quantity !== undefined) {
      if (product.quantity <= 0) {
        throw new Error('Product is out of stock')
      }
      if (product.quantity < quantity) {
        throw new Error(`Only ${product.quantity} items available in stock`)
      }
    }

    // Check if product has PayPal payment method
    if (product.paymentMethods.length === 0) {
      throw new Error('Product does not support PayPal payment')
    }

    const amount = ((product.price * quantity) / 100).toFixed(2)
    const accessToken = await this.getAccessToken()
    const siteName = getDefaultSiteName()

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: product.currency.toUpperCase(),
            value: amount,
          },
          description: product.name,
          custom_id: productId,
        },
      ],
      application_context: {
        brand_name: siteName,
        return_url: successUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`,
      },
    }

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create PayPal order: ${JSON.stringify(error)}`)
    }

    const order = await response.json()

    // Create order record in database
    await prisma.order.create({
      data: {
        productId: product.id,
        paypalOrderId: order.id,
        paymentProvider: 'paypal',
        status: 'pending',
        amount: product.price * quantity,
        currency: product.currency,
        ...(userId && { userId }),
        metadata: JSON.stringify({
          quantity,
          productName: product.name,
        }),
      },
    })

    // Get approval URL
    const approvalUrl = order.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href

    return {
      orderId: order.id,
      approvalUrl,
    }
  }

  /**
   * Create a PayPal subscription
   */
  async createSubscription(data: CreatePayPalSubscriptionRequest) {
    const { planId, userId, successUrl, cancelUrl } = data

    // Get payment method and product from database
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { paypalPlanId: planId },
      include: {
        product: true,
      },
    })

    if (!paymentMethod) {
      throw new Error('Payment method not found')
    }

    const product = paymentMethod.product

    if (!product.isActive) {
      throw new Error('Product is not active')
    }

    if (paymentMethod.mode !== 'subscription') {
      throw new Error('Payment method is not a subscription')
    }

    if (!paymentMethod.isActive) {
      throw new Error('Payment method is not active')
    }

    // Check stock availability
    if (product.quantity !== null && product.quantity !== undefined) {
      if (product.quantity <= 0) {
        throw new Error('Product is out of stock')
      }
    }

    const accessToken = await this.getAccessToken()
    const siteName = getDefaultSiteName()

    const subscriptionData = {
      plan_id: planId,
      application_context: {
        brand_name: siteName,
        user_action: 'SUBSCRIBE_NOW',
        return_url: successUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`,
      },
    }

    const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(subscriptionData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create PayPal subscription: ${JSON.stringify(error)}`)
    }

    const subscription = await response.json()

    // Create order record in database
    await prisma.order.create({
      data: {
        productId: product.id,
        paypalSubscriptionId: subscription.id,
        paymentProvider: 'paypal',
        status: 'pending',
        amount: product.price,
        currency: product.currency,
        ...(userId && { userId }),
        metadata: JSON.stringify({
          productName: product.name,
          subscriptionId: subscription.id,
        }),
      },
    })

    // Get approval URL
    const approvalUrl = subscription.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href

    return {
      subscriptionId: subscription.id,
      approvalUrl,
    }
  }

  /**
   * Capture a PayPal order after approval
   */
  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to capture PayPal order: ${JSON.stringify(error)}`)
    }

    return await response.json()
  }

  /**
   * Get PayPal order details
   */
  async getOrder(orderId: string) {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to get PayPal order: ${JSON.stringify(error)}`)
    }

    return await response.json()
  }

  /**
   * Get PayPal subscription details
   */
  async getSubscription(subscriptionId: string) {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to get PayPal subscription: ${JSON.stringify(error)}`)
    }

    return await response.json()
  }

  /**
   * Verify PayPal webhook signature
   */
  private async verifyWebhookSignature(
    body: string,
    headers: Record<string, string>,
    webhookId: string
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()

      const verificationData = {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }

      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(verificationData),
      })

      if (!response.ok) {
        console.error('Webhook signature verification failed:', await response.text())
        return false
      }

      const result = await response.json()
      return result.verification_status === 'SUCCESS'
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  /**
   * Handle PayPal webhook events
   */
  async handleWebhook(body: string, headers: Record<string, string>) {
    // Verify webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) {
      throw new Error('PAYPAL_WEBHOOK_ID is not defined')
    }

    const isValid = await this.verifyWebhookSignature(body, headers, webhookId)
    if (!isValid) {
      throw new Error('Invalid webhook signature')
    }

    // Parse webhook event
    const event = JSON.parse(body)

    // Process specific event types
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await this.onOrderApproved(event)
        break
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.onPaymentCaptureCompleted(event)
        break
      case 'PAYMENT.CAPTURE.DENIED':
        await this.onPaymentCaptureDenied(event)
        break
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await this.onSubscriptionActivated(event)
        break
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await this.onSubscriptionCancelled(event)
        break
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await this.onSubscriptionExpired(event)
        break
      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`)
    }

    return { received: true }
  }

  /**
   * Internal handler for order approved
   */
  private async onOrderApproved(event: Record<string, unknown>) {
    const resource = event.resource as Record<string, unknown>
    const orderId = resource.id as string

    console.log('PayPal order approved:', orderId)

    try {
      // Automatically capture the order after approval
      const captureResult = await this.captureOrder(orderId)
      console.log('Order captured successfully:', captureResult)

      // Update order status to processing
      const order = await prisma.order.findUnique({
        where: { paypalOrderId: orderId },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'processing' },
        })
        console.log('Order status updated to processing:', order.id)
      }
    } catch (error) {
      console.error('Error capturing approved order:', error)

      // Update order status to failed if capture fails
      const order = await prisma.order.findUnique({
        where: { paypalOrderId: orderId },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'failed' },
        })
      }
    }
  }

  /**
   * Internal handler for payment capture completed
   */
  private async onPaymentCaptureCompleted(event: Record<string, unknown>) {
    const resource = event.resource as Record<string, unknown>
    const captureId = resource.id as string

    // Get the order ID from supplementary_data or custom_id
    const supplementaryData = resource.supplementary_data as Record<string, unknown> | undefined
    const relatedIds = supplementaryData?.related_ids as Record<string, unknown> | undefined
    const orderId = relatedIds?.order_id as string | undefined

    console.log('PayPal payment capture completed:', captureId, 'for order:', orderId)

    if (!orderId) {
      console.error('No order ID found in capture event')
      return
    }

    try {
      const order = await prisma.order.findUnique({
        where: { paypalOrderId: orderId },
        include: {
          product: true,
          ...this.getUserInclude(),
        },
      })

      if (order) {
        // Verify payment amount matches order amount
        const amount = resource.amount as Record<string, unknown> | undefined
        const paidAmount = parseFloat((amount?.value as string) || '0')
        const expectedAmount = order.amount / 100

        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
          console.error('Payment amount mismatch!', {
            orderId: order.id,
            paidAmount,
            expectedAmount,
            currency: amount?.currency_code,
          })

          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'failed' },
          })

          if (this.getUser(order)) {
            console.error('SECURITY ALERT: Payment amount mismatch for order', order.id)
          }
          return
        }

        // Parse existing metadata
        const existingMetadata = order.metadata ? JSON.parse(order.metadata) : {}

        // Get payer information
        const payerInfo = resource.payer as Record<string, unknown> | undefined
        const payerName = payerInfo?.name as Record<string, unknown> | undefined
        const payerEmail = payerInfo?.email_address as string | undefined
        const payerPayerId = payerInfo?.payer_id as string | undefined

        // Prepare payment info to save
        const paymentInfo = {
          captureId,
          orderId,
          status: resource.status,
          amount: amount?.value,
          currency: amount?.currency_code,
          payerEmail,
          payerName: payerName
            ? `${payerName.given_name || ''} ${payerName.surname || ''}`.trim()
            : null,
          payerId: payerPayerId,
          createTime: resource.create_time,
          updateTime: resource.update_time,
          completedAt: new Date().toISOString(),
        }

        // Merge with existing metadata
        const updatedMetadata = {
          ...existingMetadata,
          paypalPayment: paymentInfo,
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            metadata: JSON.stringify(updatedMetadata),
          },
        })
        console.log('Order updated with payment info:', order.id)

        // Decrease product quantity if it has stock limit
        await this.decreaseProductQuantity(order.productId, order.product.quantity)

        // Send success email notification
        const user = this.getUser(order)
        if (user?.email) {
          const { sendOrderSuccessEmail } = await import('@/lib/email/order')
          await sendOrderSuccessEmail({
            to: user.email,
            userName: user.name || 'Customer',
            orderId: order.id,
            productName: order.product.name,
            amount: order.amount,
            currency: order.currency,
          })
        }
      } else {
        console.error('Order not found for PayPal order ID:', orderId)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  /**
   * Internal handler for payment capture denied
   */
  private async onPaymentCaptureDenied(event: Record<string, unknown>) {
    const resource = event.resource as Record<string, unknown>
    const captureId = resource.id as string

    // Get the order ID from supplementary_data
    const supplementaryData = resource.supplementary_data as Record<string, unknown> | undefined
    const relatedIds = supplementaryData?.related_ids as Record<string, unknown> | undefined
    const orderId = relatedIds?.order_id as string | undefined

    console.log('PayPal payment capture denied:', captureId, 'for order:', orderId)

    if (!orderId) {
      console.error('No order ID found in capture denied event')
      return
    }

    try {
      const order = await prisma.order.findUnique({
        where: { paypalOrderId: orderId },
        include: {
          product: true,
          ...this.getUserInclude(),
        },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'failed' },
        })
        console.log('Order marked as failed:', order.id)

        // Send failure email notification
        const user = this.getUser(order)
        if (user?.email) {
          const { sendOrderFailedEmail } = await import('@/lib/email/order')
          await sendOrderFailedEmail({
            to: user.email,
            userName: user.name || 'Customer',
            orderId: order.id,
            productName: order.product.name,
          })
        }
      } else {
        console.error('Order not found for PayPal order ID:', orderId)
      }
    } catch (error) {
      console.error('Error handling payment denial:', error)
    }
  }

  /**
   * Internal handler for subscription activated
   */
  private async onSubscriptionActivated(event: Record<string, unknown>) {
    const resource = event.resource as Record<string, unknown>
    const subscriptionId = resource.id as string

    console.log('PayPal subscription activated:', subscriptionId)

    try {
      const order = await prisma.order.findUnique({
        where: { paypalSubscriptionId: subscriptionId },
        include: {
          product: true,
          ...this.getUserInclude(),
        },
      })

      if (order) {
        // Parse existing metadata
        const existingMetadata = order.metadata ? JSON.parse(order.metadata) : {}

        // Get subscriber information
        const subscriber = resource.subscriber as Record<string, unknown> | undefined
        const subscriberName = subscriber?.name as Record<string, unknown> | undefined
        const subscriberEmail = subscriber?.email_address as string | undefined
        const subscriberPayerId = subscriber?.payer_id as string | undefined

        // Prepare subscription payment info to save
        const billingInfo = resource.billing_info as Record<string, unknown> | undefined
        const lastPayment = billingInfo?.last_payment as Record<string, unknown> | undefined
        const paymentInfo = {
          subscriptionId,
          status: resource.status,
          planId: resource.plan_id,
          subscriberEmail,
          subscriberName: subscriberName
            ? `${subscriberName.given_name || ''} ${subscriberName.surname || ''}`.trim()
            : null,
          subscriberId: subscriberPayerId,
          startTime: resource.start_time,
          createTime: resource.create_time,
          updateTime: resource.update_time,
          lastPaymentAmount: lastPayment?.amount,
          lastPaymentTime: lastPayment?.time,
          activatedAt: new Date().toISOString(),
        }

        // Merge with existing metadata
        const updatedMetadata = {
          ...existingMetadata,
          paypalSubscription: paymentInfo,
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            metadata: JSON.stringify(updatedMetadata),
          },
        })
        console.log('Subscription order completed with payment info:', order.id)

        // Decrease product quantity if it has stock limit
        await this.decreaseProductQuantity(order.productId, order.product.quantity)

        // Send success email notification
        const user = this.getUser(order)
        if (user?.email) {
          const { sendOrderSuccessEmail } = await import('@/lib/email/order')
          await sendOrderSuccessEmail({
            to: user.email,
            userName: user.name || 'Customer',
            orderId: order.id,
            productName: order.product.name,
            amount: order.amount,
            currency: order.currency,
          })
        }
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    }
  }

  /**
   * Internal handler for subscription cancelled
   */
  private async onSubscriptionCancelled(event: Record<string, unknown>) {
    const resource = event.resource as Record<string, unknown>
    const subscriptionId = resource.id as string

    console.log('PayPal subscription cancelled:', subscriptionId)

    try {
      const moduleState = getModuleState()
      const userInclude = moduleState.user ? {
        user: {
          select: { id: true, name: true, email: true },
        },
      } : {}

      const order = await prisma.order.findUnique({
        where: { paypalSubscriptionId: subscriptionId },
        include: {
          product: true,
          ...userInclude,
        },
      })

      if (order && order.status === 'completed') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'refunded' },
        })
        console.log('Subscription marked as cancelled:', order.id)
      }
    } catch (error) {
      console.error('Error handling subscription cancellation:', error)
    }
  }

  /**
   * Internal handler for subscription expired
   */
  private async onSubscriptionExpired(event: Record<string, unknown>) {
    const resource = event.resource as Record<string, unknown>
    const subscriptionId = resource.id as string

    console.log('PayPal subscription expired:', subscriptionId)

    try {
      const order = await prisma.order.findUnique({
        where: { paypalSubscriptionId: subscriptionId },
        include: {
          product: true,
          ...this.getUserInclude(),
        },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'expired' },
        })
        console.log('Subscription marked as expired:', order.id)

        // Send expiration email notification
        const user = this.getUser(order)
        if (user?.email) {
          const { sendOrderExpiredEmail } = await import('@/lib/email/order')
          await sendOrderExpiredEmail({
            to: user.email,
            userName: user.name || 'Customer',
            orderId: order.id,
            productName: order.product.name,
          })
        }
      }
    } catch (error) {
      console.error('Error handling subscription expiration:', error)
    }
  }
}

export const paypalService = new PayPalService()
