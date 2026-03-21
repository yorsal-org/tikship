import { getRequestConfig, getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales } from '@/config/site'

/**
 * Parse Accept-Language header and return best matching locale.
 * e.g. "zh-CN,zh;q=0.9,en;q=0.8" -> "zh"
 */
function detectLocaleFromAcceptLanguage(acceptLanguage: string): string {
  // Split by comma and sort by quality value (q)
  const parts = acceptLanguage
    .split(',')
    .map((part) => {
      const [lang, q] = part.trim().split(';q=')
      return { lang: lang.trim().toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { lang } of parts) {
    // Exact match (e.g. "zh-cn" -> "zh-CN" won't match, so try as-is first)
    if (locales.includes(lang)) return lang
    // Prefix match (e.g. "zh-CN" -> "zh")
    const prefix = lang.split('-')[0]
    if (locales.includes(prefix)) return prefix
  }

  return defaultLocale
}

/**
 * Get current locale: cookie > Accept-Language header > defaultLocale
 */
export async function getLocale(): Promise<string> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value

  // 1. Cookie takes priority (user has explicitly chosen a locale)
  if (localeCookie && locales.includes(localeCookie)) {
    return localeCookie
  }

  // 2. Fall back to browser's Accept-Language header
  try {
    const { headers } = await import('next/headers')
    const headerStore = await headers()
    const acceptLanguage = headerStore.get('accept-language')
    if (acceptLanguage) {
      return detectLocaleFromAcceptLanguage(acceptLanguage)
    }
  } catch {
    // headers() may throw outside of a request context (e.g. build time)
  }

  // 3. Hard fallback
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
