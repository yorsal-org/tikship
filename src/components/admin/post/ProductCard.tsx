'use client'

import { Product } from '@/types/product'
import { ExternalLink, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
  onRemove?: () => void
  showRemove?: boolean
}

export function ProductCard({ product, onRemove, showRemove = true }: ProductCardProps) {
  const t = useTranslations('admin.posts')

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  const productUrl = `/products/${product.slug}`

  return (
    <div className="border border-base-content/10 rounded-lg p-4 bg-base-100 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {product.image && (
          <div className="relative w-20 h-20 flex-shrink-0">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover rounded"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold truncate">{product.name}</h4>
            {showRemove && onRemove && (
              <button
                onClick={onRemove}
                className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
                title={t('editor.remove_product')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {product.description && (
            <p className="text-sm opacity-70 line-clamp-2 mt-1">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-semibold text-primary">
              {formatPrice(product.price, product.currency)}
            </span>
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-xs gap-1"
            >
              <ExternalLink size={12} />
              {t('editor.view_product')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
