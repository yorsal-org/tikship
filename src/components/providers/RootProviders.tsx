'use client'

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { LocaleProvider } from '@/components/providers/LocaleProvider'
import { SettingsProvider } from '@/hooks/useSettings'

interface Props {
  children: ReactNode
  initialLocale: string
  initialMessages: Record<string, unknown>
}

export function RootProviders({ children, initialLocale, initialMessages }: Props) {
  return (
    <LocaleProvider initialLocale={initialLocale} initialMessages={initialMessages}>
      <SessionProvider>
        <SettingsProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SettingsProvider>
      </SessionProvider>
    </LocaleProvider>
  )
}
