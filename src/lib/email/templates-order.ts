import { siteConfig } from '@/config/site'

/**
 * Order success plain text
 */
export function orderSuccessPlainText(
  userName: string,
  orderId: string,
  productName: string,
  amount: string
): string {
  return `
${siteConfig.name} - Payment Successful

Hi ${userName},

Thank you for your purchase! Your payment has been successfully processed.

Order Details:
- Order ID: ${orderId}
- Product: ${productName}
${amount ? `- Amount Paid: ${amount}` : ''}

View your order details at: ${process.env.NEXT_PUBLIC_APP_URL}/user/orders

If you have any questions about your order, please don't hesitate to contact our support team.

© 2026 ${siteConfig.name}. All rights reserved.
  `.trim()
}

/**
 * Order failed plain text
 */
export function orderFailedPlainText(
  userName: string,
  orderId: string,
  productName: string
): string {
  return `
${siteConfig.name} - Payment Failed

Hi ${userName},

Unfortunately, your payment could not be processed. This may happen due to insufficient funds, card restrictions, or other payment issues.

Order Details:
- Order ID: ${orderId}
- Product: ${productName}

What you can do:
- Check your payment method and try again
- Use a different payment method
- Contact your bank if the issue persists
- Reach out to our support team for assistance

Try again at: ${process.env.NEXT_PUBLIC_APP_URL}/products

© 2026 ${siteConfig.name}. All rights reserved.
  `.trim()
}

/**
 * Order expired plain text
 */
export function orderExpiredPlainText(
  userName: string,
  orderId: string,
  productName: string
): string {
  return `
${siteConfig.name} - Checkout Session Expired

Hi ${userName},

Your checkout session has expired. Checkout sessions are valid for 24 hours from creation.

Order Details:
- Order ID: ${orderId}
- Product: ${productName}

Don't worry! You can start a new checkout session anytime. The product is still available for purchase.

Start a new checkout at: ${process.env.NEXT_PUBLIC_APP_URL}/products

© 2026 ${siteConfig.name}. All rights reserved.
  `.trim()
}
