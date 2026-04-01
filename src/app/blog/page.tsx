import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import BlogClient from './BlogClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('site')
  const siteName = t('name')

  return {
    title: 'Blog',
    description: `Latest articles, tutorials, and updates from the ${siteName} team. Learn how to build and ship SaaS products faster.`,
    alternates: {
      canonical: '/blog',
    },
    openGraph: {
      title: `Blog | ${siteName}`,
      description: `Latest articles, tutorials, and updates from the ${siteName} team.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Blog | ${siteName}`,
      description: `Latest articles, tutorials, and updates from the ${siteName} team.`,
    },
  }
}

export default function BlogPage() {
  return <BlogClient />
}
