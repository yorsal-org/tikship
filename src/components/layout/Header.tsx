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

export function Header() {
  const { data: session, status } = useSession()
  const t = useTranslations('header')
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isRegisterPage = pathname === '/register'

  return (
    <header className="sticky top-0 z-50 w-full bg-base-100/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="navbar min-h-16 p-0">
          <div className="navbar-start">
            <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
              <Logo className="h-12 w-auto text-primary" />
            </Link>

            <nav className="ml-8 hidden md:flex items-center gap-6 font-medium">
              <Link
                href="/"
                className={cn(
                  'relative hover:text-primary transition-colors pb-1',
                  'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2',
                  'after:h-0.5 after:bg-primary after:transition-all after:duration-300',
                  pathname === '/' ? 'text-primary after:w-8' : 'after:w-0 hover:after:w-8'
                )}
              >
                {t('home')}
              </Link>
              <Link
                href="/blog"
                className={cn(
                  'relative hover:text-primary transition-colors pb-1',
                  'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2',
                  'after:h-0.5 after:bg-primary after:transition-all after:duration-300',
                  pathname.startsWith('/blog')
                    ? 'text-primary after:w-8'
                    : 'after:w-0 hover:after:w-8'
                )}
              >
                {t('blog')}
              </Link>
              <Link
                href="/products"
                className={cn(
                  'relative hover:text-primary transition-colors pb-1',
                  'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2',
                  'after:h-0.5 after:bg-primary after:transition-all after:duration-300',
                  pathname.startsWith('/products')
                    ? 'text-primary after:w-8'
                    : 'after:w-0 hover:after:w-8'
                )}
              >
                {t('products')}
              </Link>
              <a
                href="/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'relative hover:text-primary transition-colors pb-1',
                  'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2',
                  'after:h-0.5 after:bg-primary after:transition-all after:duration-300',
                  pathname.startsWith('/api-docs')
                    ? 'text-primary after:w-8'
                    : 'after:w-0 hover:after:w-8'
                )}
              >
                {t('apiDocs')}
              </a>
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
