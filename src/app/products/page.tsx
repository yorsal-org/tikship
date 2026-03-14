import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
  title: 'Products',
  description: `Browse all products and pricing plans from ${siteConfig.name}. One-time payments and subscription options available.`,
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: `Products | ${siteConfig.name}`,
    description: `Browse all products and pricing plans from ${siteConfig.name}.`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Products | ${siteConfig.name}`,
    description: `Browse all products and pricing plans from ${siteConfig.name}.`,
  },
}

export default function ProductsPage() {
  return <ProductsClient />
}
