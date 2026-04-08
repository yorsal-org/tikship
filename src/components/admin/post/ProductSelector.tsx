'use client'

import { useState, useEffect } from 'react'
import { useApi, ApiSuccess } from '@/hooks/useApi'
import { Product, ProductsListResponse } from '@/types/product'
import { Search, Package, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

interface ProductSelectorProps {
  onSelect: (product: Product) => void
  onClose: () => void
  selectedProductIds?: string[]
}

export function ProductSelector({ onSelect, onClose }: ProductSelectorProps) {
  const t = useTranslations('admin.posts')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])

  const { request: fetchProducts, loading } = useApi<ProductsListResponse>(
    '/api/admin/products',
    'GET'
  )

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const loadProducts = async () => {
    const params = new URLSearchParams({
      page: '1',
      pageSize: '20',
      status: 'active',
      ...(search && { search }),
    })

    await fetchProducts(undefined, {
      urlOverride: `/api/admin/products?${params.toString()}`,
      onSuccess: (res: ApiSuccess<ProductsListResponse>) => {
        if (res.data.products) {
          setProducts(res.data.products)
        }
      },
    })
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-content/10">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package size={20} />
            {t('editor.select_product')}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-base-content/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={18} />
            <input
              type="text"
              placeholder={t('editor.search_products')}
              className="input input-bordered w-full pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 opacity-50">
              <Package size={48} className="mx-auto mb-2 opacity-30" />
              <p>{t('editor.no_products_found')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product)
                    onClose()
                  }}
                  className="w-full p-3 rounded-lg border border-base-content/10 hover:border-primary hover:bg-base-200 transition-all text-left"
                >
                  <div className="flex gap-3">
                    {product.image && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-sm opacity-70 truncate">{product.description}</div>
                      <div className="text-sm font-semibold text-primary mt-1">
                        {formatPrice(product.price, product.currency)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
