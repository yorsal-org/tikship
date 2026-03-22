'use client'

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { LocaleProvider } from '@/components/providers/LocaleProvider'

interface Props {
  children: ReactNode
  initialLocale: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMessages: Record<string, any>
}

export function RootProviders({ children, initialLocale, initialMessages }: Props) {
  return (
    <LocaleProvider initialLocale={initialLocale} initialMessages={initialMessages}>
      <SessionProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </SessionProvider>
    </LocaleProvider>
  )
}
