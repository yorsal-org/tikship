'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Plus, Edit, Search, Power, PowerOff, Package } from 'lucide-react'
import { toast } from '@/lib/utils/toast'
import { Table, Column } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useApi } from '@/hooks/useApi'
import { useAdminPagination as usePagination } from '@/hooks/useAdminPagination'
import { siteConfig } from '@/config/site'
import type { Product, ProductsListResponse } from '@/types/product'

export function ProductList() {
  const t = useTranslations('admin.products')
  const router = useRouter()

  const {
    page: currentPage,
    search: searchParam,
    searchInput,
    setSearchInput,
    handlePageChange,
    handleFilterChange: syncFilters,
    getParam,
    pageSize,
  } = usePagination({ pageSize: siteConfig.admin.pageSize })

  const statusParam = getParam('status')

  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: siteConfig.admin.pageSize as number,
    total: 0,
    totalPages: 0,
  })

  // API hooks
  const productsApi = useApi<ProductsListResponse>('/api/admin/products', 'GET')
  const toggleActiveApi = useApi('', 'POST')

  const fetchData = useCallback(
    async (page: number) => {
      const productsRes = await productsApi.request(undefined, {
        params: {
          page,
          pageSize,
          search: searchParam || undefined,
          status: statusParam || undefined,
        },
        onError: (err: string) => toast.error(err),
      })

      if (productsRes.success && productsRes.data) {
        const products = productsRes.data.products || []
        setProducts(products)
        
        // Fetch payment methods for each product
        const productsWithMethods = await Promise.all(
          products.map(async (product: Product) => {
            try {
              const response = await fetch(`/api/admin/products/${product.id}/payment-methods`)
              const result = await response.json()
              return {
                ...product,
                paymentMethodsCount: result.data?.paymentMethods?.length || 0,
                paymentProviders: result.data?.paymentMethods?.map((m: { provider: string }) => m.provider) || []
              }
            } catch {
              return { ...product, paymentMethodsCount: 0, paymentProviders: [] }
            }
          })
        )
        
        setProducts(productsWithMethods)
        setPagination({
          page: productsRes.data.pagination.page,
          pageSize: productsRes.data.pagination.pageSize,
          total: productsRes.data.pagination.total,
          totalPages: productsRes.data.pagination.totalPages,
        })
      }
    },
    [productsApi, pageSize, searchParam, statusParam]
  )

  useEffect(() => {
    const loadData = async () => {
      await fetchData(currentPage)
    }
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchParam, statusParam])

  const handleEdit = (product: Product) => {
    router.push(`${siteConfig.admin.path}/products/${product.id}/edit`)
  }

  const handleToggleActive = async (product: Product) => {
    const { success } = await toggleActiveApi.request(undefined, {
      urlOverride: `/api/admin/products/${product.id}/toggle-active`,
      onError: (err: string) => toast.error(err),
    })

    if (success) {
      toast.success(product.isActive ? t('deactivate_success') : t('activate_success'))
      router.refresh()
      await fetchData(currentPage)
    }
  }

  const handleStatusFilterChange = (value: string) => {
    syncFilters({ status: value })
  }

  const columns: Column<Product>[] = [
    {
      key: 'name',
      label: t('name'),
      render: product => (
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded relative bg-base-200 flex items-center justify-center">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded"
                />
              ) : (
                <Package className="w-6 h-6 text-base-content/40" />
              )}
            </div>
          </div>
          <div>
            <div className="font-bold">{product.name}</div>
            {product.description && (
              <div className="text-sm text-base-content/60 line-clamp-1">{product.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      label: t('slug'),
      render: product => <code className="text-xs">{product.slug}</code>,
    },
    {
      key: 'paymentMethods',
      label: t('payment_methods'),
      render: product => {
        const p = product as Product & { paymentMethodsCount?: number; paymentProviders?: string[] }
        if (!p.paymentMethodsCount) {
          return <span className="text-base-content/40 text-sm">{t('no_payment_methods')}</span>
        }
        return (
          <div className="flex gap-1 flex-wrap">
            {p.paymentProviders?.includes('stripe') && (
              <span className="badge badge-sm badge-outline">Stripe</span>
            )}
            {p.paymentProviders?.includes('paypal') && (
              <span className="badge badge-sm badge-outline">PayPal</span>
            )}
            <span className="text-xs text-base-content/60">({p.paymentMethodsCount})</span>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: t('status'),
      render: product => (
        <StatusBadge
          status={product.isActive ? t('active') : t('inactive')}
          variant={product.isActive ? 'success' : 'ghost'}
        />
      ),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: product => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(product)}
            className="btn btn-ghost btn-sm btn-square"
            title={t('edit')}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(product)}
            className={`btn btn-ghost btn-sm btn-square ${product.isActive ? 'text-warning' : 'text-success'}`}
            title={product.isActive ? t('deactivate') : t('activate')}
            disabled={toggleActiveApi.loading}
          >
            {product.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-base-content/70">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => router.push(`${siteConfig.admin.path}/products/new`)}
          className="btn btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('create_product')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute z-1 left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>

        <select
          value={statusParam || ''}
          onChange={e => handleStatusFilterChange(e.target.value)}
          className="select select-bordered w-40"
        >
          <option value="">{t('all_status')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={products}
        loading={productsApi.loading}
        emptyMessage={t('no_products')}
        pagination={pagination}
        onPageChange={handlePageChange}
        getRowKey={product => product.id}
      />
    </>
  )
}
