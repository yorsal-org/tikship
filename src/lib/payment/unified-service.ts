import { stripeService } from '@/lib/payment/stripe-service'
import { paypalService } from '@/lib/payment/paypal-service'
import { prisma } from '@/lib/db/prisma'

export interface CreatePaymentRequest {
  productId: string
  quantity?: number
  userId?: string
  successUrl?: string
  cancelUrl?: string
  paymentProvider?: 'stripe' | 'paypal'
}

export class UnifiedPaymentService {
  /**
   * Create a payment session (Stripe or PayPal)
   * Automatically selects the payment provider based on product configuration
   */
  async createPayment(data: CreatePaymentRequest) {
    const { productId, quantity = 1, userId, successUrl, cancelUrl, paymentProvider } = data

    // Get product from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        paymentMethods: true,
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

    // Determine which payment provider to use
    let provider = paymentProvider
    let paymentMethod = null

    if (!provider) {
      // Auto-select based on available payment methods
      const activeMethods = product.paymentMethods.filter(m => m.isActive)
      if (activeMethods.length === 0) {
        throw new Error('No active payment method configured for this product')
      }
      // Default to first active method
      paymentMethod = activeMethods[0]
      provider = paymentMethod.provider as 'stripe' | 'paypal'
    } else {
      // Find the payment method for the selected provider
      paymentMethod = product.paymentMethods.find(
        m => m.provider === provider && m.isActive
      )
      if (!paymentMethod) {
        throw new Error(`Product does not support ${provider} payment`)
      }
    }

    // Create payment session based on provider
    if (provider === 'stripe') {
      return await this.createStripePayment(product, paymentMethod, quantity, userId, successUrl, cancelUrl)
    } else {
      return await this.createPayPalPayment(product, paymentMethod, quantity, userId, successUrl, cancelUrl)
    }
  }

  /**
   * Create Stripe payment session
   */
  private async createStripePayment(
    product: {
      id: string
      name: string
      price: number
      currency: string
    },
    paymentMethod: {
      id: string
      stripePriceId: string | null
      mode: string
    },
    quantity: number,
    userId?: string,
    successUrl?: string,
    cancelUrl?: string
  ) {
    if (!paymentMethod.stripePriceId) {
      throw new Error('Payment method does not have a Stripe Price ID')
    }

    const { sessionId, url } = await stripeService.createCheckoutSession({
      items: [
        {
          priceId: paymentMethod.stripePriceId,
          quantity,
        },
      ],
      mode: paymentMethod.mode as 'payment' | 'subscription',
      successUrl:
        successUrl ||
        `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`,
      metadata: {
        productId: product.id,
        productName: product.name,
        paymentMethodId: paymentMethod.id,
        ...(userId && { userId }),
      },
    })

    console.log("The new order's stripe session Id: ", sessionId)

    // Create order record
    await prisma.order.create({
      data: {
        productId: product.id,
        stripeSessionId: sessionId,
        paymentProvider: 'stripe',
        status: 'pending',
        amount: product.price * quantity,
        currency: product.currency,
        ...(userId && { userId }),
        metadata: JSON.stringify({
          quantity,
          productName: product.name,
          paymentMethodId: paymentMethod.id,
        }),
      },
    })

    return {
      provider: 'stripe',
      sessionId,
      url,
    }
  }

  /**
   * Create PayPal payment session
   */
  private async createPayPalPayment(
    product: {
      id: string
      name: string
      price: number
      currency: string
    },
    paymentMethod: {
      id: string
      paypalPlanId: string | null
      mode: string
    },
    quantity: number,
    userId?: string,
    successUrl?: string,
    cancelUrl?: string
  ) {
    if (paymentMethod.mode === 'subscription') {
      if (!paymentMethod.paypalPlanId) {
        throw new Error('Payment method does not have a PayPal Plan ID')
      }

      const result = await paypalService.createSubscription({
        planId: paymentMethod.paypalPlanId,
        userId,
        successUrl: successUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
        cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`,
      })

      return {
        provider: 'paypal',
        subscriptionId: result.subscriptionId,
        url: result.approvalUrl,
      }
    } else {
      const result = await paypalService.createOrder({
        productId: product.id,
        quantity,
        userId,
        successUrl: successUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
        cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`,
      })

      return {
        provider: 'paypal',
        orderId: result.orderId,
        url: result.approvalUrl,
      }
    }
  }

  /**
   * Get supported payment methods for a product
   */
  async getProductPaymentMethods(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        paymentMethods: {
          where: { isActive: true },
          select: {
            id: true,
            provider: true,
            stripePriceId: true,
            paypalPlanId: true,
            mode: true,
          },
        },
      },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    return product.paymentMethods.map(method => ({
      id: method.id,
      provider: method.provider,
      mode: method.mode,
      hasStripePrice: !!method.stripePriceId,
      hasPayPalPlan: !!method.paypalPlanId,
    }))
  }
}

export const unifiedPaymentService = new UnifiedPaymentService()
