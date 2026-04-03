import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getTranslations } from 'next-intl/server'
import { getModuleState } from '@/lib/module-state'
import ProductDetailClient from './ProductDetailClient'

const BASE_URL = process.env.NEXTAUTH_URL || ''

interface Props {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  try {
    return await prisma.product.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        slug: true,
        price: true,
        currency: true,
      },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency.toUpperCase(),
  }).format(product.price / 100)
  const t = await getTranslations('site')
  const siteName = t('name')

  const title = product.name
  const description = product.description || `${product.name} — ${priceFormatted}. Available on ${siteName}.`

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: `/products/${slug}`,
      type: 'website',
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteName}`,
      description,
      images: product.image ? [product.image] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  const t = await getTranslations('site')
  const siteName = t('name')
  const { social: isSocialEnabled } = getModuleState()

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description ?? undefined,
        image: product.image ?? undefined,
        url: `${BASE_URL}/products/${product.slug}`,
        offers: {
          '@type': 'Offer',
          price: (product.price / 100).toFixed(2),
          priceCurrency: product.currency.toUpperCase(),
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/products/${product.slug}`,
        },
        brand: {
          '@type': 'Brand',
          name: siteName,
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient params={params} isSocialEnabled={isSocialEnabled} />
    </>
  )
}
