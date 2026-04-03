'use client'

import { useLocale } from 'next-intl'
import { setLocale } from '@/lib/i18n/locale-cookie'
import { Languages } from 'lucide-react'
import { useLocaleSettings } from '@/hooks/useSettings'

interface LanguageSwitcherProps {
  locale1?: string
  locale2?: string
}

export function LanguageSwitcher({
  locale1,
  locale2,
}: LanguageSwitcherProps) {
  const locale = useLocale()
  const { locale: localeSettings } = useLocaleSettings()

  const switchLocale1 = locale1 ?? localeSettings.supported[0]?.value ?? 'en'
  const switchLocale2 = locale2 ?? localeSettings.supported[1]?.value ?? 'zh'

  const toggleLocale = () => {
    const newLocale = locale === switchLocale1 ? switchLocale2 : switchLocale1
    setLocale(newLocale)
    window.location.reload()
  }

  return (
    <button className="btn btn-ghost btn-circle" onClick={toggleLocale}>
      <Languages className={`h-5 w-5 ${locale === switchLocale2 ? '' : 'scale-x-[-1]'}`} />
    </button>
  )
}
