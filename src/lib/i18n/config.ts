import { getRequestConfig, getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales } from '@/config/site'

/**
 * Get current locale from cookies or fallback to default
 */
export async function getLocale(): Promise<string> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value

  // Validate and use cookie locale or fallback to default
  if (localeCookie && locales.includes(localeCookie)) {
    return localeCookie
  }

  return defaultLocale
}

/**
 * Get translations for 'api' namespace
 */
export async function getApiTranslations() {
  const locale = await getLocale()
  return getTranslations({ locale, namespace: 'api' })
}

export default getRequestConfig(async () => {
  const locale = await getLocale()

  return {
    locale,
    messages: (await import(`../../locales/${locale}.json`)).default,
  }
})
