'use client'

import { useLocale } from 'next-intl'
import { setLocale } from '@/lib/i18n/detector'
import { Languages } from 'lucide-react'
import { siteConfig } from '@/config/site'

interface LanguageSwitcherProps {
  locale1?: string
  locale2?: string
}

export function LanguageSwitcher({
  locale1 = siteConfig.locale.supported[0]['value'],
  locale2 = siteConfig.locale.supported[1]['value'],
}: LanguageSwitcherProps) {
  const locale = useLocale()

  const toggleLocale = () => {
    const newLocale = locale === locale1 ? locale2 : locale1
    setLocale(newLocale)
    window.location.reload()
  }

  return (
    <button className="btn btn-ghost btn-circle" onClick={toggleLocale}>
      <Languages className={`h-5 w-5 ${locale === locale2 ? '' : 'scale-x-[-1]'}`} />
    </button>
  )
}
