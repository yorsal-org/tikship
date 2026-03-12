'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/admin/product/ProductForm'
import { useApi } from '@/hooks/useApi'
import { toast } from '@/lib/utils/toast'
import type { Product } from '@/types/product'
import { Loader2 } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const productApi = useApi<{ product: Product }>(`/api/admin/products/${id}`, 'GET')

  useEffect(() => {
    const fetchProduct = async () => {
      const { success, data } = await productApi.request(undefined, {
        onError: (err: string) => {
          toast.error(err)
          router.push(`${siteConfig.admin.path}/products`)
        },
      })

      if (success && data) {
        setProduct(data.product)
      }
    }

    void fetchProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (productApi.loading || !product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProductForm product={product} />
    </div>
  )
}
