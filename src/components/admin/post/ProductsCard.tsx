'use client'

import { useState } from 'react'
import { Product } from '@/types/product'
import { Package, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ProductSelector } from './ProductSelector'
import { ProductCard } from './ProductCard'

interface ProductsCardProps {
  products: Product[]
  onAdd: (product: Product) => void
  onRemove: (productId: string) => void
}

export function ProductsCard({ products, onAdd, onRemove }: ProductsCardProps) {
  const t = useTranslations('admin.posts')
  const [showSelector, setShowSelector] = useState(false)

  return (
    <>
      <div className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package size={18} />
              {t('editor.products')}
              {products.length > 0 && (
                <span className="badge badge-primary badge-sm">{products.length}</span>
              )}
            </h3>
            <button
              onClick={() => setShowSelector(true)}
              className="btn btn-primary btn-sm gap-1"
            >
              <Plus size={16} />
              {t('editor.add_product')}
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-6 opacity-50">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('editor.no_products_added')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onRemove={() => onRemove(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showSelector && (
        <ProductSelector
          onSelect={onAdd}
          onClose={() => setShowSelector(false)}
          selectedProductIds={products.map(p => p.id)}
        />
      )}
    </>
  )
}
