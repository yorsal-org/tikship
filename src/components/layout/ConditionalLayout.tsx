'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin') || false
  const isApiDocsRoute = pathname === '/api-docs'

  if (isAdminRoute || isApiDocsRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="grow flex flex-col">{children}</main>
      <Footer />
    </>
  )
}
