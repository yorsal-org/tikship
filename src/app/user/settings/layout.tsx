'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, ShieldCheck, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations('user_profile')

  const navItems = [
    {
      label: t('profile_tab'),
      href: '/user/settings/profile',
      icon: <User className="w-5 h-5" />,
    },
    {
      label: t('security_tab'),
      href: '/user/settings/security',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24">
            <h2 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider px-4 mb-4">
              {t('edit_profile')}
            </h2>
            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                        : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${isActive ? 'text-primary-content' : 'text-primary'}`}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isActive
                          ? 'opacity-100 translate-x-1'
                          : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                      }`}
                    />
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="grow min-w-0">
          <div className="bg-base-100 rounded-2xl border border-base-200 p-6 lg:p-8 shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
