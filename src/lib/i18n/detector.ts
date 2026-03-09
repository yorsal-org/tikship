import { locales, defaultLocale } from '@/config/site'

export function detectBrowserLocale() {
  if (typeof window === 'undefined') return defaultLocale

  // Check cookie first
  const cookieLocale = document.cookie
    .split('; ')
    .find(row => row.startsWith('locale='))
    ?.split('=')[1]

  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  // Detect from browser
  const browserLang = navigator.language.toLowerCase()

  // Check exact match
  if (locales.includes(browserLang)) {
    return browserLang
  }

  // Check language prefix (e.g., 'zh-CN' -> 'zh')
  const langPrefix = browserLang.split('-')[0]
  if (locales.includes(langPrefix)) {
    return langPrefix
  }

  return defaultLocale
}

function setLocaleCookie(locale: string) {
  // Set cookie with 1 year expiry
  const maxAge = 365 * 24 * 60 * 60 // 1 year in seconds
  document.cookie = `locale=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function setLocale(locale: string) {
  if (typeof window !== 'undefined') {
    setLocaleCookie(locale)
  }
}
