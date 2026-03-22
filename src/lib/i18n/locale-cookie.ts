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
