'use client'

import { ProductList } from '@/components/admin/product/ProductList'
import { ProductStats } from '@/components/admin/product/ProductStats'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <ProductStats />
      <ProductList />
    </div>
  )
}
