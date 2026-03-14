'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Grid3x3, List, Layers, ArrowRight } from 'lucide-react'
import { PaginationWrapper } from '@/components/ui/PaginationWrapper'
import { usePagination } from '@/hooks/usePagination'
import { useTranslations } from 'next-intl'

interface Product {
  id: string
  name: string
  description?: string
  image?: string
  slug: string
  price: number
  currency: string
  quantity?: number | null
  createdAt: string
}

export default function ProductsShowcasePage() {
  const t = useTranslations('products')

  // Fetch function for pagination
  const fetchProducts = useCallback(async (page: number, pageSize: number) => {
    const response = await fetch(`/api/products?page=${page}&pageSize=${pageSize}`)
    const result = await response.json()

    if (result.success && result.data) {
      const products = result.data.products
      const totalCount = result.data.totalCount || products.length

      return { items: products, totalCount }
    }

    return { items: [], totalCount: 0 }
  }, [])

  // Use pagination hook
  const {
    items: products,
    currentPage,
    totalCount,
    pageSize,
    loading,
    hasMore,
    goToPage,
    loadMore,
    type,
    setType,
    observerTarget,
  } = usePagination<Product>({
    fetchFunction: fetchProducts,
    pageSize: 12,
    type: 'traditional',
  })

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  const renderProducts = (items: unknown[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map(item => {
          const product = item as Product
          return (
            <div
              key={product.id}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <figure className="h-48 relative bg-base-200 flex items-center justify-center">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                ) : (
                  <Package className="w-20 h-20 text-base-content/20" />
                )}
              </figure>
              <div className="card-body">
                <h2 className="card-title">{product.name}</h2>
                {product.description && (
                  <p className="text-base-content/70 line-clamp-3">{product.description}</p>
                )}

                <div className="my-4">
                  <div className="text-3xl font-bold">{formatPrice(product.price, product.currency)}</div>
                  {product.quantity !== null && product.quantity !== undefined && (
                    <div className="text-sm text-base-content/60 mt-1">
                      {product.quantity > 0 ? (
                        <span className="badge badge-success badge-sm">
                          {t('in_stock', { count: product.quantity })}
                        </span>
                      ) : (
                        <span className="badge badge-error badge-sm">{t('out_of_stock')}</span>
                      )}
                    </div>
                  )}
                  {(product.quantity === null || product.quantity === undefined) && (
                    <div className="text-sm text-base-content/60 mt-1">
                      <span className="badge badge-ghost badge-sm">{t('unlimited')}</span>
                    </div>
                  )}
                </div>

                <div className="card-actions justify-end mt-4">
                  <Link
                    href={`/products/${product.slug}`}
                    className="btn btn-primary w-full gap-2"
                  >
                    {t('view_details')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-base-content/70">{t('subtitle')}</p>
      </div>

      {/* Pagination Type Selector */}
      <div className="flex justify-center mb-8">
        <div className="join">
          <button
            className={`btn btn-sm join-item gap-2 ${type === 'traditional' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setType('traditional')}
          >
            <Grid3x3 className="w-4 h-4" />
            {t('traditional')}
          </button>
          <button
            className={`btn btn-sm join-item gap-2 ${type === 'loadMore' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setType('loadMore')}
          >
            <List className="w-4 h-4" />
            {t('load_more')}
          </button>
          <button
            className={`btn btn-sm join-item gap-2 ${type === 'infinite' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setType('infinite')}
          >
            <Layers className="w-4 h-4" />
            {t('infinite_scroll')}
          </button>
        </div>
      </div>

      <PaginationWrapper
        items={products}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        type={type}
        onPageChange={goToPage}
        onLoadMore={loadMore}
        loading={loading}
        hasMore={hasMore}
        renderData={renderProducts}
        loadMoreText={t('load_more_products')}
        loadingText={t('loading_products')}
        noMoreText={t('no_more_products')}
        observerTarget={observerTarget}
      />
    </div>
  )
}
