'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode, useState, useEffect, createContext, useContext } from 'react'
import { detectBrowserLocale } from '@/lib/i18n/detector'
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
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<string>(defaultLocale)
  const [messages, setMessages] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const loadMessages = async (newLocale: string) => {
    try {
      const localeModule = await import(`@/locales/${newLocale}.json`)
      setMessages(localeModule.default)
      return true
    } catch {
      // Fallback to default locale
      const defaultModule = await import(`@/locales/${defaultLocale}.json`)
      setMessages(defaultModule.default)
      return false
    }
  }

  useEffect(() => {
    const detectedLocale = detectBrowserLocale() as string
    setLocaleState(detectedLocale)
    loadMessages(detectedLocale).then(() => setIsLoading(false))
  }, [])

  const setLocale = async (newLocale: string) => {
    setLocaleState(newLocale)
    // Use the utility function which sets cookie
    const { setLocale: setLocaleUtil } = await import('@/lib/i18n/detector')
    setLocaleUtil(newLocale)
    await loadMessages(newLocale)
  }

  if (isLoading) {
    return null
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}
