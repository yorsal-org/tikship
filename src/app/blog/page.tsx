import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import BlogClient from './BlogClient'

export const metadata: Metadata = {
  title: 'Blog',
  description: `Latest articles, tutorials, and updates from the ${siteConfig.name} team. Learn how to build and ship SaaS products faster.`,
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: `Blog | ${siteConfig.name}`,
    description: `Latest articles, tutorials, and updates from the ${siteConfig.name} team.`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Blog | ${siteConfig.name}`,
    description: `Latest articles, tutorials, and updates from the ${siteConfig.name} team.`,
  },
}

export default function BlogPage() {
  return <BlogClient />
}
