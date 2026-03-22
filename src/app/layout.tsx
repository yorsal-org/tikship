import type { Metadata } from 'next'
import '@/app/globals.css'
import '@/styles/datepicker.css'
import { themeInitScript } from '@/lib/utils/theme'
import { siteConfig } from '@/config/site'
import { getLocale } from '@/lib/i18n/config'

const BASE_URL = process.env.NEXTAUTH_URL || ''

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name, url: BASE_URL }],
    creator: siteConfig.name,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: BASE_URL,
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: siteConfig.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.name,
      description: siteConfig.description,
      creator: `@${siteConfig.name.toLowerCase()}`,
    },
    icons: {
      icon: siteConfig.favicon,
      shortcut: siteConfig.favicon,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

import { RootProviders as Providers } from '@/components/providers/RootProviders'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { ToastContainer } from '@/components/ui/Toast'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: Record<string, any> = (await import(`../locales/${locale}.json`)).default

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-base-100">
        <Providers initialLocale={locale} initialMessages={messages}>
          <ConditionalLayout>{children}</ConditionalLayout>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
