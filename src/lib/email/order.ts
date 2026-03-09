import { sendEmail } from '@/lib/email/service'
import {
  orderSuccessPlainText,
  orderFailedPlainText,
  orderExpiredPlainText,
} from '@/lib/email/templates-order'

interface OrderEmailData {
  to: string
  userName: string
  orderId: string
  productName: string
  amount?: number
  currency?: string
}

/**
 * Send order success email
 */
export async function sendOrderSuccessEmail(data: OrderEmailData) {
  const { to, userName, orderId, productName, amount, currency } = data

  const formattedAmount =
    amount && currency
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency.toUpperCase(),
        }).format(amount / 100)
      : ''

  const text = orderSuccessPlainText(userName, orderId, productName, formattedAmount)

  return await sendEmail({
    to,
    subject: '🎉 Payment Successful - Order Confirmed',
    text,
  })
}

/**
 * Send order failed email
 */
export async function sendOrderFailedEmail(data: Omit<OrderEmailData, 'amount' | 'currency'>) {
  const { to, userName, orderId, productName } = data

  const text = orderFailedPlainText(userName, orderId, productName)

  return await sendEmail({
    to,
    subject: '❌ Payment Failed - Order Not Completed',
    text,
  })
}

/**
 * Send order expired email
 */
export async function sendOrderExpiredEmail(data: Omit<OrderEmailData, 'amount' | 'currency'>) {
  const { to, userName, orderId, productName } = data

  const text = orderExpiredPlainText(userName, orderId, productName)

  return await sendEmail({
    to,
    subject: '⏰ Checkout Session Expired',
    text,
  })
}
