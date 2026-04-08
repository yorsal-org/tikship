import type { Metadata } from 'next'
import '@/app/globals.css'
import '@/styles/datepicker.css'
import { themeInitScript } from '@/lib/utils/theme'
import { settingsService } from '@/lib/settings/service'
import { getLocale } from '@/lib/i18n/config'
import { getTranslations } from 'next-intl/server'

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('site')
  const siteName = t('name')
  const siteDescription = t('description')
  const siteKeywords = t('keywords')
  const systemSettings = await settingsService.getSystemSettings()

  return {
    metadataBase: BASE_URL ? new URL(BASE_URL) : undefined,
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    keywords: siteKeywords,
    authors: [{ name: siteName, url: BASE_URL }],
    creator: siteName,
    openGraph: {
      type: 'website',
      locale: locale,
      url: BASE_URL,
      siteName: siteName,
      title: siteName,
      description: siteDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: siteDescription,
      creator: `@${siteName.toLowerCase()}`,
    },
    icons: {
      icon: systemSettings.favicon,
      shortcut: systemSettings.favicon,
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
  const messages: Record<string, unknown> = (
      await import(`../locales/${locale}.json`)
    ).default as Record<string, unknown>

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
