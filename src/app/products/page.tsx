import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ProductsClient from './ProductsClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ namespace: 'site' })
  const siteName = t('name')

  return {
    title: 'Products',
    description: `Browse all products and pricing plans from ${siteName}. One-time payments and subscription options available.`,
    alternates: {
      canonical: '/products',
    },
    openGraph: {
      title: `Products | ${siteName}`,
      description: `Browse all products and pricing plans from ${siteName}.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Products | ${siteName}`,
      description: `Browse all products and pricing plans from ${siteName}.`,
    },
  }
}

export default function ProductsPage() {
  return <ProductsClient />
}
