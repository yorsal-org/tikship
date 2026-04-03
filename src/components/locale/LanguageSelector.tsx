'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { setLocale } from '@/lib/i18n/locale-cookie'
import { useLocaleSettings } from '@/hooks/useSettings'

export function LanguageSelector() {
  const currentLocale = useLocale()
  const { locale } = useLocaleSettings()
  const [selectedLocale, setSelectedLocale] = useState(currentLocale)

  useEffect(() => {
    setSelectedLocale(currentLocale)
  }, [currentLocale])

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value

    // Check if locale is supported
    if (!locale.supported.some(lang => lang.value === newLocale)) {
      return
    }

    setSelectedLocale(newLocale)

    // Save to cookie for persistence
    setLocale(newLocale)

    // Reload page to apply new locale
    window.location.reload()
  }

  return (
    <select
      className="select select-bordered w-full max-w-xs"
      value={selectedLocale}
      onChange={handleLocaleChange}
      aria-label="Select language"
    >
      {locale.supported.map(lang => (
        <option key={lang.value} value={lang.value}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  )
}
