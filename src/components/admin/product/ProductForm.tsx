'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Globe, CreditCard, Trash2, Power, PowerOff } from 'lucide-react'
import { RichTextEditor } from '@/components/admin/post/RichTextEditor'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import { generateSlug } from '@/lib/utils/common'
import { validationConfig } from '@/config/validation'
import { siteConfig } from '@/config/site'
import type { Product, PaymentMethod } from '@/types/product'

interface ProductFormProps {
  product?: Product | null
}

interface PaymentMethodForm {
  id?: string
  provider: string
  stripePriceId: string
  stripeProductId: string
  paypalPlanId: string
  paypalProductId: string
  mode: string
  interval: string
  intervalCount: string
  isActive: boolean
  metadata: string
}

export function ProductForm({ product }: ProductFormProps) {
  const t = useTranslations('admin.products')
  const router = useRouter()
  const isEditing = !!product

  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [content, setContent] = useState(product?.content || '')
  const [slug, setSlug] = useState(product?.slug || '')
  const [image, setImage] = useState(product?.image || '')
  const [price, setPrice] = useState(product?.price?.toString() || '')
  const [currency, setCurrency] = useState(product?.currency || (siteConfig.payment.defaultCurrency as string))
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || '')
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [metadata, setMetadata] = useState(product?.metadata || '')

  const [stripeMethod, setStripeMethod] = useState<PaymentMethodForm | null>(null)
  const [paypalMethod, setPaypalMethod] = useState<PaymentMethodForm | null>(null)
  const [deletedMethodIds, setDeletedMethodIds] = useState<string[]>([])
  const [stripePriceIdError, setStripePriceIdError] = useState<string>('')
  const [checkingPriceId, setCheckingPriceId] = useState(false)
  const [paypalPlanIdError, setPaypalPlanIdError] = useState<string>('')
  const [checkingPlanId, setCheckingPlanId] = useState(false)

  const createApi = useApi('/api/admin/products', 'POST')
  const updateApi = useApi(product ? `/api/admin/products/${product.id}` : '', 'PATCH')
  const methodsApi = useApi<{ paymentMethods: PaymentMethod[] }>(
    product ? `/api/admin/products/${product.id}/payment-methods` : '',
    'GET'
  )
  const checkPriceIdApi = useApi<{ exists: boolean }>(
    '/api/admin/products/check-price-id',
    'GET'
  )
  const checkPlanIdApi = useApi<{ exists: boolean }>(
    '/api/admin/products/check-price-id',
    'GET'
  )

  // Load existing payment methods
  useEffect(() => {
    if (isEditing && product) {
      const loadMethods = async () => {
        const { success, data } = await methodsApi.request(undefined, {
          onError: () => {},
        })

        if (success && data?.paymentMethods) {
          data.paymentMethods.forEach((m) => {
            const method: PaymentMethodForm = {
              id: m.id,
              provider: m.provider,
              stripePriceId: m.stripePriceId || '',
              stripeProductId: m.stripeProductId || '',
              paypalPlanId: m.paypalPlanId || '',
              paypalProductId: m.paypalProductId || '',
              mode: m.mode,
              interval: m.interval || (siteConfig.payment.defaultInterval as string),
              intervalCount: m.intervalCount?.toString() || '1',
              isActive: m.isActive,
              metadata: m.metadata || '',
            }

            if (m.provider === 'stripe') {
              setStripeMethod(method)
            } else if (m.provider === 'paypal') {
              setPaypalMethod(method)
            }
          })
        }
      }
      void loadMethods()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, product?.id])

  // Slug generation logic - only auto-generate when creating new product and slug is empty
  useEffect(() => {
    if (!isEditing && name) {
      setSlug(generateSlug(name))
    }
  }, [name, isEditing])

  // Check Stripe Price ID uniqueness
  useEffect(() => {
    if (!stripeMethod?.stripePriceId) {
      setStripePriceIdError('')
      return
    }

    // Skip check if editing the same payment method
    if (stripeMethod.id) {
      setStripePriceIdError('')
      return
    }

    const timer = setTimeout(async () => {
      setCheckingPriceId(true)
      setStripePriceIdError('')

      const { success, data } = await checkPriceIdApi.request(undefined, {
        params: { stripePriceId: stripeMethod.stripePriceId },
        onError: () => {},
      })

      setCheckingPriceId(false)

      if (success && data?.exists) {
        setStripePriceIdError(t('stripe_price_id_exists'))
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeMethod?.stripePriceId, stripeMethod?.id])

  // Check PayPal Plan ID uniqueness
  useEffect(() => {
    if (!paypalMethod?.paypalPlanId || paypalMethod.mode !== 'subscription') {
      setPaypalPlanIdError('')
      return
    }

    // Skip check if editing the same payment method
    if (paypalMethod.id) {
      setPaypalPlanIdError('')
      return
    }

    const timer = setTimeout(async () => {
      setCheckingPlanId(true)
      setPaypalPlanIdError('')

      const { success, data } = await checkPlanIdApi.request(undefined, {
        params: { paypalPlanId: paypalMethod.paypalPlanId },
        onError: () => {},
      })

      setCheckingPlanId(false)

      if (success && data?.exists) {
        setPaypalPlanIdError(t('paypal_plan_id_exists'))
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalMethod?.paypalPlanId, paypalMethod?.mode, paypalMethod?.id])

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error(t('name_required'))
      return
    }
    if (!slug.trim()) {
      toast.error(t('slug_required'))
      return
    }
    if (!price || parseInt(price) <= 0) {
      toast.error(t('price_required'))
      return
    }

    // Validate Stripe method if exists
    if (stripeMethod) {
      if (!stripeMethod.stripePriceId.trim()) {
        toast.error(t('stripe_price_id_required'))
        return
      }
      if (stripePriceIdError) {
        toast.error(stripePriceIdError)
        return
      }
      
      // Final check for uniqueness before saving
      const { success, data } = await checkPriceIdApi.request(undefined, {
        params: { stripePriceId: stripeMethod.stripePriceId },
        onError: () => {},
      })
      
      // Only check if creating new payment method (no id)
      if (success && data?.exists && !stripeMethod.id) {
        toast.error(t('stripe_price_id_exists'))
        return
      }
    }

    // Validate PayPal method if exists
    if (paypalMethod) {
      // Validate PayPal Plan ID for subscription mode
      if (paypalMethod.mode === 'subscription') {
        if (!paypalMethod.paypalPlanId?.trim()) {
          toast.error(t('paypal_plan_id_required'))
          return
        }
        if (paypalPlanIdError) {
          toast.error(paypalPlanIdError)
          return
        }
        
        // Final check for uniqueness before saving
        const { success, data } = await checkPlanIdApi.request(undefined, {
          params: { paypalPlanId: paypalMethod.paypalPlanId },
          onError: () => {},
        })
        
        // Only check if creating new payment method (no id)
        if (success && data?.exists && !paypalMethod.id) {
          toast.error(t('paypal_plan_id_exists'))
          return
        }
      }
    }

    console.log('Saving product...', { name, slug, price, currency, quantity, stripeMethod, paypalMethod })

    // Validate price
    const priceValue = parseInt(price)
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error(t('price_required'))
      return
    }

    // Save product first
    const api = isEditing ? updateApi : createApi
    const { success, data } = await api.request(
      {
        name,
        description,
        content,
        slug,
        image,
        price: priceValue,
        currency,
        quantity: quantity ? parseInt(quantity) : null,
        isActive,
        metadata,
      },
      {
        onError: (error: string) => toast.error(error),
      }
    )

    if (!success || !data) {
      console.error('Failed to save product')
      return
    }

    const productId = isEditing ? product!.id : (data as { product: Product }).product.id
    console.log('Product saved, ID:', productId)

    // Save payment methods
    try {
      // Delete removed methods
      for (const methodId of deletedMethodIds) {
        console.log('Deleting payment method:', methodId)
        const deleteRes = await fetch(`/api/admin/products/${productId}/payment-methods/${methodId}`, {
          method: 'DELETE',
        })
        if (!deleteRes.ok) {
          const error = await deleteRes.json()
          console.error('Delete payment method error:', error)
        }
      }

      // Save Stripe method
      if (stripeMethod) {
        console.log('Saving Stripe method:', stripeMethod)
        const payload = {
          provider: 'stripe',
          stripePriceId: stripeMethod.stripePriceId,
          stripeProductId: stripeMethod.stripeProductId || null,
          paypalPlanId: null,
          paypalProductId: null,
          mode: stripeMethod.mode,
          interval: stripeMethod.mode === 'subscription' ? stripeMethod.interval : null,
          intervalCount:
            stripeMethod.mode === 'subscription' ? parseInt(stripeMethod.intervalCount) : null,
          isActive: stripeMethod.isActive,
          metadata: stripeMethod.metadata || null,
        }

        console.log('Stripe payload:', payload)

        const url = stripeMethod.id
          ? `/api/admin/products/${productId}/payment-methods/${stripeMethod.id}`
          : `/api/admin/products/${productId}/payment-methods`
        
        const method = stripeMethod.id ? 'PATCH' : 'POST'
        
        console.log('Stripe request:', method, url)
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        console.log('Stripe response:', response.status, result)

        if (!response.ok) {
          console.error('Save Stripe payment method error:', result)
          throw new Error(result.message || result.error || 'Failed to save Stripe payment method')
        }
      }

      // Save PayPal method
      if (paypalMethod) {
        console.log('Saving PayPal method:', paypalMethod)
        const payload = {
          provider: 'paypal',
          stripePriceId: null,
          stripeProductId: null,
          paypalPlanId:
            paypalMethod.mode === 'subscription' ? paypalMethod.paypalPlanId || null : null,
          paypalProductId: paypalMethod.paypalProductId || null,
          mode: paypalMethod.mode,
          interval: paypalMethod.mode === 'subscription' ? paypalMethod.interval : null,
          intervalCount:
            paypalMethod.mode === 'subscription' ? parseInt(paypalMethod.intervalCount) : null,
          isActive: paypalMethod.isActive,
          metadata: paypalMethod.metadata || null,
        }

        console.log('PayPal payload:', payload)

        const url = paypalMethod.id
          ? `/api/admin/products/${productId}/payment-methods/${paypalMethod.id}`
          : `/api/admin/products/${productId}/payment-methods`
        
        const method = paypalMethod.id ? 'PATCH' : 'POST'
        
        console.log('PayPal request:', method, url)
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        console.log('PayPal response:', response.status, result)

        if (!response.ok) {
          console.error('Save PayPal payment method error:', result)
          throw new Error(result.message || result.error || 'Failed to save PayPal payment method')
        }
      }

      console.log('All payment methods saved successfully')
      toast.success(t(isEditing ? 'update_success' : 'create_success'))
      router.push(`${siteConfig.admin.path}/products`)
      router.refresh()
    } catch (error) {
      console.error('Save payment methods error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save payment methods')
    }
  }

  const addStripeMethod = () => {
    setStripeMethod({
      provider: 'stripe',
      stripePriceId: '',
      stripeProductId: '',
      paypalPlanId: '',
      paypalProductId: '',
      mode: siteConfig.payment.defaultMode as string,
      interval: siteConfig.payment.defaultInterval as string,
      intervalCount: siteConfig.payment.defaultIntervalCount.toString(),
      isActive: true,
      metadata: '',
    })
  }

  const addPaypalMethod = () => {
    setPaypalMethod({
      provider: 'paypal',
      stripePriceId: '',
      stripeProductId: '',
      paypalPlanId: '',
      paypalProductId: '',
      mode: siteConfig.payment.defaultMode as string,
      interval: siteConfig.payment.defaultInterval as string,
      intervalCount: siteConfig.payment.defaultIntervalCount.toString(),
      isActive: true,
      metadata: '',
    })
  }

  const removeStripeMethod = () => {
    if (stripeMethod?.id) {
      setDeletedMethodIds(prev => [...prev, stripeMethod.id!])
    }
    setStripeMethod(null)
  }

  const removePaypalMethod = () => {
    if (paypalMethod?.id) {
      setDeletedMethodIds(prev => [...prev, paypalMethod.id!])
    }
    setPaypalMethod(null)
  }

  const updateStripeMethod = (field: string, value: string | boolean) => {
    if (stripeMethod) {
      setStripeMethod({ ...stripeMethod, [field]: value })
    }
  }

  const updatePaypalMethod = (field: string, value: string | boolean) => {
    if (paypalMethod) {
      setPaypalMethod({ ...paypalMethod, [field]: value })
    }
  }

  const toggleStripeActive = () => {
    if (stripeMethod) {
      setStripeMethod({ ...stripeMethod, isActive: !stripeMethod.isActive })
    }
  }

  const togglePaypalActive = () => {
    if (paypalMethod) {
      setPaypalMethod({ ...paypalMethod, isActive: !paypalMethod.isActive })
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-1">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Product Name */}
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t('name_placeholder')}
            className="input input-ghost input-lg w-full text-3xl font-bold px-0 focus:bg-transparent focus:outline-none placeholder:opacity-50"
            value={name}
            onChange={e => setName(e.target.value)}
            minLength={validationConfig.product.name.minLength}
            maxLength={validationConfig.product.name.maxLength}
          />
          <div className="text-xs opacity-50 mt-1 text-right">
            {name.length}/{validationConfig.product.name.maxLength}
          </div>
        </fieldset>

        {/* Slug */}
        <div className="flex items-center gap-2 text-sm opacity-70">
          <span className="font-mono">{t('slug')}:</span>
          <span>/products/</span>
          <input
            type="text"
            className="input input-xs input-bordered w-auto"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            minLength={validationConfig.product.slug?.minLength || 1}
            maxLength={validationConfig.product.slug?.maxLength || 200}
          />
          <span className="text-xs opacity-50">
            {slug.length}/{validationConfig.product.slug?.maxLength || 200}
          </span>
        </div>

        {/* Description */}
        <fieldset className="fieldset">
          <label className="label">
            <span className="label-text font-medium">{t('description')}</span>
            <span className="label-text-alt opacity-50">
              {description.length}/{validationConfig.product.description.maxLength}
            </span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('description_placeholder')}
            className="textarea textarea-bordered w-full"
            maxLength={validationConfig.product.description.maxLength}
            rows={3}
          />
        </fieldset>

        {/* Rich Text Content */}
        <div>
          <label className="label">
            <span className="label-text font-medium">{t('product_content')}</span>
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder={t('content_placeholder')}
          />
        </div>

        {/* Payment Methods */}
        <div className="collapse collapse-arrow bg-base-100 border border-base-content/10 shadow-sm overflow-visible">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title font-medium flex items-center gap-2">
            <CreditCard size={18} />
            {t('payment_methods')}
          </div>
          <div className="collapse-content space-y-4 pt-2">
            {/* Stripe Payment Method */}
            <div className="border border-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Stripe</span>
                  {stripeMethod && (
                    <span
                      className={`badge badge-sm ${stripeMethod.isActive ? 'badge-success' : 'badge-ghost'}`}
                    >
                      {stripeMethod.isActive ? t('active') : t('inactive')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {stripeMethod ? (
                    <>
                      <button
                        type="button"
                        onClick={toggleStripeActive}
                        className="btn btn-ghost btn-sm btn-square"
                        title={stripeMethod.isActive ? t('deactivate') : t('activate')}
                      >
                        {stripeMethod.isActive ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={removeStripeMethod}
                        className="btn btn-ghost btn-sm btn-square text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={addStripeMethod} className="btn btn-primary btn-sm">
                      {t('add_payment_method')}
                    </button>
                  )}
                </div>
              </div>

              {stripeMethod && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <fieldset className="fieldset md:col-span-2">
                    <label className="label">
                      <span className="label-text">
                        {t('stripe_price_id')} <span className="text-error">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={stripeMethod.stripePriceId}
                        onChange={e => updateStripeMethod('stripePriceId', e.target.value)}
                        placeholder={t('stripe_price_id_placeholder')}
                        className={`input input-bordered w-full ${stripePriceIdError ? 'input-error' : ''}`}
                        maxLength={validationConfig.product.stripePriceId.maxLength}
                        required
                      />
                      {checkingPriceId && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="loading loading-spinner loading-sm"></span>
                        </div>
                      )}
                    </div>
                    {stripePriceIdError && (
                      <label className="label">
                        <span className="label-text-alt text-error">{stripePriceIdError}</span>
                      </label>
                    )}
                  </fieldset>

                  <fieldset className="fieldset md:col-span-2">
                    <label className="label">
                      <span className="label-text">{t('stripe_product_id')}</span>
                    </label>
                    <input
                      type="text"
                      value={stripeMethod.stripeProductId}
                      onChange={e => updateStripeMethod('stripeProductId', e.target.value)}
                      placeholder={t('stripe_product_id_placeholder')}
                      className="input input-bordered w-full"
                      maxLength={validationConfig.product.stripeProductId.maxLength}
                    />
                  </fieldset>

                  <fieldset className="fieldset">
                    <label className="label">
                      <span className="label-text">{t('mode')}</span>
                    </label>
                    <select
                      value={stripeMethod.mode}
                      onChange={e => updateStripeMethod('mode', e.target.value)}
                      className="select select-bordered w-full"
                    >
                      {siteConfig.payment.modes.map(mode => (
                        <option key={mode.value} value={mode.value}>
                          {t(`mode_${mode.value}`)}
                        </option>
                      ))}
                    </select>
                  </fieldset>

                  {stripeMethod.mode === 'subscription' && (
                    <>
                      <fieldset className="fieldset">
                        <label className="label">
                          <span className="label-text">{t('interval')}</span>
                        </label>
                        <select
                          value={stripeMethod.interval}
                          onChange={e => updateStripeMethod('interval', e.target.value)}
                          className="select select-bordered w-full"
                        >
                          {siteConfig.payment.intervals.map(interval => (
                            <option key={interval.value} value={interval.value}>
                              {t(`interval_${interval.value}`)}
                            </option>
                          ))}
                        </select>
                      </fieldset>

                      <fieldset className="fieldset">
                        <label className="label">
                          <span className="label-text">{t('interval_count')}</span>
                        </label>
                        <input
                          type="number"
                          value={stripeMethod.intervalCount}
                          onChange={e => updateStripeMethod('intervalCount', e.target.value)}
                          className="input input-bordered w-full"
                          min="1"
                        />
                      </fieldset>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* PayPal Payment Method */}
            <div className="border border-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">PayPal</span>
                  {paypalMethod && (
                    <span
                      className={`badge badge-sm ${paypalMethod.isActive ? 'badge-success' : 'badge-ghost'}`}
                    >
                      {paypalMethod.isActive ? t('active') : t('inactive')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {paypalMethod ? (
                    <>
                      <button
                        type="button"
                        onClick={togglePaypalActive}
                        className="btn btn-ghost btn-sm btn-square"
                        title={paypalMethod.isActive ? t('deactivate') : t('activate')}
                      >
                        {paypalMethod.isActive ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={removePaypalMethod}
                        className="btn btn-ghost btn-sm btn-square text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={addPaypalMethod} className="btn btn-primary btn-sm">
                      {t('add_payment_method')}
                    </button>
                  )}
                </div>
              </div>

              {paypalMethod && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paypalMethod.mode === 'subscription' && (
                    <fieldset className="fieldset md:col-span-2">
                      <label className="label">
                        <span className="label-text">
                          {t('paypal_plan_id')} <span className="text-error">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={paypalMethod.paypalPlanId}
                          onChange={e => updatePaypalMethod('paypalPlanId', e.target.value)}
                          placeholder={t('paypal_plan_id_placeholder')}
                          className={`input input-bordered w-full ${paypalPlanIdError ? 'input-error' : ''}`}
                          maxLength={validationConfig.product.paypalPlanId.maxLength}
                          required
                        />
                        {checkingPlanId && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="loading loading-spinner loading-sm"></span>
                          </div>
                        )}
                      </div>
                      {paypalPlanIdError && (
                        <label className="label">
                          <span className="label-text-alt text-error">{paypalPlanIdError}</span>
                        </label>
                      )}
                    </fieldset>
                  )}

                  <fieldset className="fieldset md:col-span-2">
                    <label className="label">
                      <span className="label-text">{t('paypal_product_id')}</span>
                    </label>
                    <input
                      type="text"
                      value={paypalMethod.paypalProductId}
                      onChange={e => updatePaypalMethod('paypalProductId', e.target.value)}
                      placeholder={t('paypal_product_id_placeholder')}
                      className="input input-bordered w-full"
                      maxLength={validationConfig.product.paypalProductId.maxLength}
                    />
                  </fieldset>

                  <fieldset className="fieldset">
                    <label className="label">
                      <span className="label-text">{t('mode')}</span>
                    </label>
                    <select
                      value={paypalMethod.mode}
                      onChange={e => updatePaypalMethod('mode', e.target.value)}
                      className="select select-bordered w-full"
                    >
                      {siteConfig.payment.modes.map(mode => (
                        <option key={mode.value} value={mode.value}>
                          {t(`mode_${mode.value}`)}
                        </option>
                      ))}
                    </select>
                  </fieldset>

                  {paypalMethod.mode === 'subscription' && (
                    <>
                      <fieldset className="fieldset">
                        <label className="label">
                          <span className="label-text">{t('interval')}</span>
                        </label>
                        <select
                          value={paypalMethod.interval}
                          onChange={e => updatePaypalMethod('interval', e.target.value)}
                          className="select select-bordered w-full"
                        >
                          {siteConfig.payment.intervals.map(interval => (
                            <option key={interval.value} value={interval.value}>
                              {t(`interval_${interval.value}`)}
                            </option>
                          ))}
                        </select>
                      </fieldset>

                      <fieldset className="fieldset">
                        <label className="label">
                          <span className="label-text">{t('interval_count')}</span>
                        </label>
                        <input
                          type="number"
                          value={paypalMethod.intervalCount}
                          onChange={e => updatePaypalMethod('intervalCount', e.target.value)}
                          className="input input-bordered w-full"
                          min="1"
                        />
                      </fieldset>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO / Metadata */}
        <div className="collapse collapse-arrow bg-base-100 border border-base-content/10 shadow-sm">
          <input type="checkbox" />
          <div className="collapse-title font-medium flex items-center gap-2">
            <Globe size={18} />
            {t('additional_settings')}
          </div>
          <div className="collapse-content">
            <fieldset className="fieldset">
              <label className="label">
                <span className="label-text">{t('metadata')}</span>
                <span className="label-text-alt opacity-50">
                  {metadata.length}/{validationConfig.product.metadata.maxLength}
                </span>
              </label>
              <textarea
                value={metadata}
                onChange={e => setMetadata(e.target.value)}
                placeholder={t('metadata_placeholder')}
                className="textarea textarea-bordered w-full"
                maxLength={validationConfig.product.metadata.maxLength}
                rows={3}
              />
            </fieldset>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        {/* Publish Card */}
        <div className="card bg-base-100 shadow-xl border border-base-content/10">
          <div className="card-body">
            <h3 className="card-title text-base">{t('status')}</h3>
            <fieldset className="fieldset">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">{t('is_active')}</span>
              </label>
            </fieldset>
            <div className="divider my-2"></div>
            <Button
              onClick={handleSave}
              loading={createApi.loading || updateApi.loading}
              className="w-full"
            >
              {isEditing ? t('save') : t('create')}
            </Button>
          </div>
        </div>

        {/* Price & Inventory */}
        <div className="card bg-base-100 shadow-xl border border-base-content/10">
          <div className="card-body">
            <h3 className="card-title text-base">{t('price_inventory')}</h3>
            
            <fieldset className="fieldset">
              <label className="label">
                <span className="label-text">
                  {t('price')} <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder={t('price_placeholder')}
                className="input input-bordered w-full"
                min="0"
                required
              />
              <label className="label">
                <span className="label-text-alt">{t('price_hint')}</span>
              </label>
            </fieldset>

            <fieldset className="fieldset">
              <label className="label">
                <span className="label-text">{t('currency')}</span>
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="select select-bordered w-full"
              >
                {siteConfig.payment.currencies.map(curr => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <label className="label">
                <span className="label-text">{t('quantity')}</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder={t('quantity_placeholder')}
                className="input input-bordered w-full"
                min="0"
              />
              <label className="label">
                <span className="label-text-alt">{t('quantity_hint')}</span>
              </label>
            </fieldset>
          </div>
        </div>

        {/* Featured Image */}
        <div className="card bg-base-100 shadow-xl border border-base-content/10">
          <div className="card-body">
            <h3 className="card-title text-base">{t('featured_image')}</h3>
            <ImageUpload
              uploadEndpoint="/api/admin/upload/image"
              value={image}
              onChange={setImage}
              maxSize={5}
              allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
