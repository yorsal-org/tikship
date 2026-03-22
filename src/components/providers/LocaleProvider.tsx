'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode, useState, createContext, useContext } from 'react'
import { setLocale as setLocaleCookie } from '@/lib/i18n/locale-cookie'
import { defaultLocale } from '@/config/site'

interface LocaleContextType {
  locale: string
  setLocale: (locale: string) => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function useLocaleContext() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider')
  }
  return context
}

interface LocaleProviderProps {
  children: ReactNode
  initialLocale?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMessages?: Record<string, any>
}

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
  initialMessages = {},
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<string>(initialLocale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<Record<string, any>>(initialMessages)

  const setLocale = async (newLocale: string) => {
    try {
      const localeModule = await import(`@/locales/${newLocale}.json`)
      setMessages(localeModule.default)
    } catch {
      // keep current messages on error
    }
    setLocaleState(newLocale)
    setLocaleCookie(newLocale)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
