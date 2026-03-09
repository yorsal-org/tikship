'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="w-24 h-24 text-success mx-auto" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-base-content/70 mb-8">
          Thank you for your purchase. Your payment has been processed successfully.
        </p>
        {sessionId && (
          <div className="bg-base-200 p-4 rounded-lg mb-8">
            <p className="text-sm text-base-content/60">Session ID:</p>
            <code className="text-xs wrap-break-word">{sessionId}</code>
          </div>
        )}
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
