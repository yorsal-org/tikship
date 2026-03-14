'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ShoppingCart, Package, CreditCard } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import type { Product, PaymentMethod } from '@/types/product'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const t = useTranslations('products')

  const [product, setProduct] = useState<Product | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const productApi = useApi<{ product: Product }>(`/api/products/${slug}`, 'GET')
  const methodsApi = useApi<{ paymentMethods: PaymentMethod[] }>(
    `/api/products/${slug}/payment-methods`,
    'GET'
  )

  useEffect(() => {
    const fetchData = async () => {
      const [productRes, methodsRes] = await Promise.all([
        productApi.request(undefined, {
          onError: (err: string) => {
            toast.error(err)
            router.push('/products')
          },
        }),
        methodsApi.request(undefined, {
          onError: () => {},
        }),
      ])

      if (productRes.success && productRes.data) {
        setProduct(productRes.data.product)
      }

      if (methodsRes.success && methodsRes.data) {
        const methods = methodsRes.data.paymentMethods || []
        setPaymentMethods(methods)
        if (methods.length > 0) {
          setSelectedMethod(methods[0].id)
        }
      }
    }

    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const handleCheckout = async () => {
    if (!selectedMethod) {
      toast.error(t('select_payment_method'))
      return
    }

    setCheckoutLoading(true)

    try {
      const method = paymentMethods.find(m => m.id === selectedMethod)
      if (!method) return

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product?.id,
          paymentMethodId: selectedMethod,
          paymentProvider: method.provider,
          quantity: 1,
        }),
      })

      const result = await response.json()

      if (result.success && result.data.url) {
        window.location.href = result.data.url
      } else {
        toast.error(result.error || t('checkout_failed'))
      }
    } catch {
      toast.error(t('checkout_failed'))
    } finally {
      setCheckoutLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  const formatInterval = (mode: string, interval?: string | null, intervalCount?: number | null) => {
    if (mode !== 'subscription') return t('one_time')
    const count = intervalCount || 1
    return `${count > 1 ? count + ' ' : ''}${interval || 'month'}${count > 1 ? 's' : ''}`
  }

  if (productApi.loading || !product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => router.push('/products')}
        className="btn btn-ghost btn-sm gap-2 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('back_to_products')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="relative aspect-square bg-base-200 rounded-lg overflow-hidden flex items-center justify-center">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          ) : (
            <Package className="w-32 h-32 text-base-content/20" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            {product.description && (
              <p className="text-lg text-base-content/70">{product.description}</p>
            )}
          </div>

          {/* Price Display */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              {formatPrice(product.price, product.currency)}
            </div>
            {product.quantity !== null && product.quantity !== undefined && (
              <div className="text-sm">
                {product.quantity > 0 ? (
                  <span className="badge badge-success">
                    {t('in_stock', { count: product.quantity })}
                  </span>
                ) : (
                  <span className="badge badge-error">{t('out_of_stock')}</span>
                )}
              </div>
            )}
            {(product.quantity === null || product.quantity === undefined) && (
              <div className="text-sm">
                <span className="badge badge-ghost">{t('unlimited_stock')}</span>
              </div>
            )}
          </div>

          {/* Payment Methods Selection */}
          {paymentMethods.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('choose_payment_method')}</h3>
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-base-300 hover:border-base-content/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                      className="radio radio-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="font-medium capitalize">{method.provider}</span>
                        {method.mode === 'subscription' && (
                          <span className="badge badge-sm">
                            {formatInterval(method.mode, method.interval, method.intervalCount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Checkout Button */}
          {paymentMethods.length > 0 ? (
            <button
              onClick={handleCheckout}
              className="btn btn-primary btn-lg w-full gap-2"
              disabled={checkoutLoading || !selectedMethod || (product.quantity !== null && product.quantity !== undefined && product.quantity <= 0)}
            >
              {checkoutLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  {paymentMethods.find(m => m.id === selectedMethod)?.mode === 'subscription'
                    ? t('subscribe_now')
                    : t('buy_now')}
                </>
              )}
            </button>
          ) : (
            <div className="alert alert-warning">
              <span>{t('no_payment_methods')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Content */}
      {product.content && (
        <div className="mt-12">
          <div className="divider"></div>
          <div
            className="prose prose-base max-w-none"
            dangerouslySetInnerHTML={{ __html: product.content }}
          />
        </div>
      )}
    </div>
  )
}
