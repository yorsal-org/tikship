import type { Metadata } from 'next'
import '@/app/globals.css'
import '@/styles/datepicker.css'
import { themeInitScript } from '@/lib/utils/theme'
import { siteConfig } from '@/config/site'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: siteConfig.name,
    description: siteConfig.description,
    icons: {
      icon: siteConfig.favicon,
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-base-100">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
