import { stripe } from '@/lib/payment/stripe'
import { CreateCheckoutSessionRequest } from '@/types/stripe'
import { prisma } from '@/lib/db/prisma'
import Stripe from 'stripe'
import { getModuleState } from '@/lib/module-state'

export class StripeService {
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
   * Create a Stripe checkout session
   */
  async createCheckoutSession(data: CreateCheckoutSessionRequest) {
    const { items, successUrl, cancelUrl, customerId, metadata } = data

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      mode: data.mode || 'payment',
      success_url: successUrl || process.env.STRIPE_SUCCESS_URL || '',
      cancel_url: cancelUrl || process.env.STRIPE_CANCEL_URL || '',
      metadata,
    }

    if (customerId) {
      sessionData.customer = customerId
    }

    const session = await stripe.checkout.sessions.create(sessionData)

    return {
      sessionId: session.id,
      url: session.url,
    }
  }

  /**
   * Sync or create a Stripe customer
   */
  async getOrCreateCustomer(email: string, name?: string) {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      return customers.data[0]
    }

    return await stripe.customers.create({
      email,
      name,
    })
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(body: string, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      throw new Error(`Webhook signature verification failed: ${message}`)
    }

    // Process specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await this.onCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.async_payment_succeeded':
        await this.onCheckoutSessionAsyncPaymentSucceeded(
          event.data.object as Stripe.Checkout.Session
        )
        break
      case 'checkout.session.async_payment_failed':
        await this.onCheckoutSessionAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return { received: true }
  }

  /**
   * Internal handler for completed checkout sessions
   */
  private async onCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    console.log('Payment completed for session:', session.id)

    try {
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: {
          product: true,
          ...this.getUserInclude(),
        },
      })

      if (order) {
        // Verify payment amount matches order amount
        const paidAmount = (session.amount_total || 0) / 100 // Stripe amount is in cents
        const expectedAmount = order.amount / 100

        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
          console.error('Payment amount mismatch!', {
            orderId: order.id,
            paidAmount,
            expectedAmount,
            currency: session.currency,
          })

          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'failed' },
          })

          // Send amount mismatch alert
          console.error('SECURITY ALERT: Payment amount mismatch for order', order.id)
          return
        }

        // Parse existing metadata
        const existingMetadata = order.metadata ? JSON.parse(order.metadata) : {}

        // Get customer details to retrieve email
        const customerEmail = session.customer_details?.email || null
        const customerName = session.customer_details?.name || null
        const customerPhone = session.customer_details?.phone || null

        // Prepare payment info to save
        const paymentInfo = {
          paymentIntentId: session.payment_intent,
          customerId: session.customer,
          customerEmail,
          customerName,
          customerPhone,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentMethodTypes: session.payment_method_types,
          completedAt: new Date().toISOString(),
        }

        // Merge with existing metadata
        const updatedMetadata = {
          ...existingMetadata,
          stripePayment: paymentInfo,
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            stripeCustomerId: session.customer as string,
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
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  /**
   * Internal handler for expired checkout sessions
   */
  private async onCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    console.log('Checkout session expired:', session.id)

    try {
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: {
          product: true,
          ...this.getUserInclude(),
        },
      })

      if (order && order.status === 'pending') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'expired' },
        })
        console.log('Order marked as expired:', order.id)

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
      console.error('Error handling expired session:', error)
    }
  }

  /**
   * Internal handler for async payment succeeded
   */
  private async onCheckoutSessionAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
    console.log('Async payment succeeded for session:', session.id)

    try {
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: {
          product: true,
          ...this.getUserInclude(),
        },
      })

      if (order) {
        // Verify payment amount matches order amount
        const paidAmount = (session.amount_total || 0) / 100 // Stripe amount is in cents
        const expectedAmount = order.amount / 100

        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
          console.error('Payment amount mismatch!', {
            orderId: order.id,
            paidAmount,
            expectedAmount,
            currency: session.currency,
          })

          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'failed' },
          })

          // Send amount mismatch alert
          console.error('SECURITY ALERT: Payment amount mismatch for order', order.id)
          return
        }

        // Parse existing metadata
        const existingMetadata = order.metadata ? JSON.parse(order.metadata) : {}

        // Get customer details to retrieve email
        const customerEmail = session.customer_details?.email || null
        const customerName = session.customer_details?.name || null
        const customerPhone = session.customer_details?.phone || null

        // Prepare payment info to save
        const paymentInfo = {
          paymentIntentId: session.payment_intent,
          customerId: session.customer,
          customerEmail,
          customerName,
          customerPhone,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentMethodTypes: session.payment_method_types,
          completedAt: new Date().toISOString(),
          asyncPayment: true,
        }

        // Merge with existing metadata
        const updatedMetadata = {
          ...existingMetadata,
          stripePayment: paymentInfo,
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            stripeCustomerId: session.customer as string,
            metadata: JSON.stringify(updatedMetadata),
          },
        })
        console.log('Order completed after async payment with payment info:', order.id)

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
      console.error('Error handling async payment success:', error)
    }
  }

  /**
   * Internal handler for async payment failed
   */
  private async onCheckoutSessionAsyncPaymentFailed(session: Stripe.Checkout.Session) {
    console.log('Async payment failed for session:', session.id)

    try {
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
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
      }
    } catch (error) {
      console.error('Error handling async payment failure:', error)
    }
  }
}

export const stripeService = new StripeService()
