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
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMobileMenuOpen(false)
    })
  }, [pathname])

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
            {/* Mobile hamburger */}
            <button
              className="btn btn-square btn-ghost lg:hidden mr-1"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <Link href="/" className="hidden lg:flex items-center transition-opacity hover:opacity-80">
              <Logo className="h-12 w-auto text-primary" />
            </Link>

            {/* Desktop nav */}
            <nav className="ml-8 hidden lg:flex items-center gap-6 font-medium">
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
                    className={cn(
                      'btn btn-sm hidden sm:inline-flex',
                      isRegisterPage ? 'btn-primary' : 'btn-ghost'
                    )}
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed inset-0 lg:hidden',
          isMobileMenuOpen ? '' : 'pointer-events-none'
        )}
      >
        {/* Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black transition-opacity duration-300',
            isMobileMenuOpen ? 'opacity-50' : 'opacity-0'
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer panel */}
        <aside
          className={cn(
            'fixed left-0 top-0 h-screen w-72 bg-base-100 shadow-xl flex flex-col transform transition-transform duration-300',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-base-200">
            <Link
              href="/"
              className="flex items-center hover:opacity-80"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {siteConfig.name}
            </Link>
            <button
              className="btn btn-square btn-ghost btn-sm"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer nav links */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="menu menu-md p-0 gap-1">
              {navItems.map((item) => {
                const isActive = item.matchPath?.(pathname) || false
                const linkProps = item.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {}
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      {...linkProps}
                      className={cn(
                        isActive
                          ? 'bg-primary text-primary-content font-bold shadow-md'
                          : 'hover:bg-base-200'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Drawer footer: auth actions */}
          {!session && (
            <div className="px-4 py-4 border-t border-base-200 flex flex-col gap-2">
              <Link
                href="/login"
                className={cn('btn btn-sm w-full', isLoginPage ? 'btn-primary' : 'btn-outline')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className={cn(
                  'btn btn-sm w-full',
                  isRegisterPage ? 'btn-primary' : 'btn-outline'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('register')}
              </Link>
            </div>
          )}
        </aside>
      </div>
    </header>
  )
}
