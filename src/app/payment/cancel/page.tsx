'use client'

import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <XCircle className="w-24 h-24 text-warning mx-auto" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-base-content/70 mb-8">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/products" className="btn btn-primary">
            View Products
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
