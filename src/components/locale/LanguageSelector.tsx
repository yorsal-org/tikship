'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { setLocale } from '@/lib/i18n/locale-cookie'
import { siteConfig } from '@/config/site'

// Get language options from site config
const LANGUAGE_OPTIONS = siteConfig.locale.supported

export function LanguageSelector() {
  const currentLocale = useLocale()
  const [mounted, setMounted] = useState(false)
  const [selectedLocale, setSelectedLocale] = useState(currentLocale)

  useEffect(() => {
    // Use setTimeout to avoid setState during render
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!mounted) return
    Promise.resolve().then(() => {
      setSelectedLocale(currentLocale)
    })
  }, [mounted, currentLocale])

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value

    // Check if locale is supported
    if (!siteConfig.locale.supported.some(lang => lang.value === newLocale)) {
      return
    }

    setSelectedLocale(newLocale)

    // Save to cookie for persistence
    setLocale(newLocale)

    // Reload page to apply new locale
    window.location.reload()
  }

  if (!mounted) {
    return null
  }

  return (
    <select
      className="select select-bordered w-full max-w-xs"
      value={selectedLocale}
      onChange={handleLocaleChange}
      aria-label="Select language"
    >
      {LANGUAGE_OPTIONS.map(lang => (
        <option key={lang.value} value={lang.value}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  )
}
