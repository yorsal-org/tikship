'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ThemeToggler } from '@/components/theme/ThemeToggler'
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher'
import { UserProfile } from '@/components/auth/user/Profile'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils/common'
import { siteConfig } from '@/config/site'

interface NavItem {
  href: string
  labelKey: string
  external?: boolean
  matchPath?: (pathname: string) => boolean
}

export function Header() {
  const { data: session, status } = useSession()
  const t = useTranslations('header')
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isRegisterPage = pathname === '/register'

  const navItems: NavItem[] = [
    {
      href: '/',
      labelKey: 'home',
      matchPath: (path) => path === '/',
    },
    {
      href: '/blog',
      labelKey: 'blog',
      matchPath: (path) => path.startsWith('/blog'),
    },
    {
      href: '/products',
      labelKey: 'products',
      matchPath: (path) => path.startsWith('/products'),
    },
    ...(siteConfig.enable_api_docs
      ? [
          {
            href: '/api-docs',
            labelKey: 'apiDocs',
            external: true,
            matchPath: (path: string) => path.startsWith('/api-docs'),
          },
        ]
      : []),
  ]

  const linkClassName =
    'relative hover:text-primary transition-colors pb-1 ' +
    'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 ' +
    'after:h-0.5 after:bg-primary after:transition-all after:duration-300 '

  return (
    <header className="sticky top-0 z-50 w-full bg-base-100/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="navbar min-h-16 p-0">
          <div className="navbar-start">
            <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
              <Logo className="h-12 w-auto text-primary" />
            </Link>

            <nav className="ml-8 hidden md:flex items-center gap-6 font-medium">
              {navItems.map((item) => {
                const isActive = item.matchPath?.(pathname) || false
                const linkProps = item.external
                  ? {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    }
                  : {}

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    {...linkProps}
                    className={cn(
                      linkClassName,
                      isActive ? 'text-primary after:w-8' : 'after:w-0 hover:after:w-8'
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="navbar-end gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggler />
              <LanguageSwitcher />

              {status === 'loading' ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : session ? (
                <UserProfile />
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={cn('btn btn-sm', isLoginPage ? 'btn-primary' : 'btn-ghost')}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className={cn('btn btn-sm', isRegisterPage ? 'btn-primary' : 'btn-ghost')}
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
