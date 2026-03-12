'use client'

import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'
import { siteConfig } from '@/config/site'
import Link from 'next/link'

export function Footer() {
  const t = useTranslations('common')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-base-200/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Logo className="h-8 w-auto" />
            </div>
            <p className="max-w-xs text-sm text-base-content/70">{t('tagline')}</p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-bold underline decoration-primary decoration-2 underline-offset-4">
              Resources
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-base-content/70">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Components
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-bold underline decoration-secondary decoration-2 underline-offset-4">
              Legal
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-base-content/70">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider my-8 opactiy-20"></div>

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row text-sm text-base-content/50">
          <p>
            © {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-4">{/* Social links could go here */}</div>
        </div>
      </div>
    </footer>
  )
}
