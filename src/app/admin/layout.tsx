'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useAdminAuth } from '@/components/providers/AdminAuthProvider'
import { AdminAuthProvider } from '@/components/providers/AdminAuthProvider'
import { ThemeToggler } from '@/components/theme/ThemeToggler'
import { LanguageSwitcher } from '@/components/locale/LanguageSwitcher'
import { SidebarMenu } from '@/components/admin/common/SidebarMenu'
import { LogOut, Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { siteConfig } from '@/config/site'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('admin.layout')
  const { adminUser, isLoading, logout } = useAdminAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Read initial state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-collapsed')
      return saved === 'true'
    }
    return false
  })

  // Save to localStorage when collapse state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', String(isSidebarCollapsed))
    }
  }, [isSidebarCollapsed])

  // Check if current page is login page
  const isLoginPage = pathname === siteConfig.admin.path + '/login'

  useEffect(() => {
    if (!isLoading && !adminUser && !isLoginPage) {
      router.push(`${siteConfig.admin.path}/login`)
    }
  }, [adminUser, isLoading, router, isLoginPage])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Helper to check if a route is active
  const isActive = (path: string) => {
    if (!pathname) return false
    if (path === siteConfig.admin.path) return pathname === siteConfig.admin.path
    return pathname.startsWith(path)
  }

  // Show loading spinner
  if (isLoading && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  // Render login page without layout
  if (isLoginPage) {
    return <>{children}</>
  }

  // Redirect to login if not authenticated
  if (!adminUser) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Desktop Sidebar - Always visible on large screens */}
      <aside
        className={`bg-base-100 shadow-xl border-r border-base-200 hidden lg:flex flex-col transition-all duration-300 relative ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className={`p-6 ${isSidebarCollapsed ? 'px-4' : ''}`}>
          <Link href={siteConfig.admin.path} className="flex items-center">
            <Logo />
            {!isSidebarCollapsed && (
              <h1 className="text-base font-extrabold tracking-tight whitespace-nowrap overflow-hidden">
                {t('title')}
              </h1>
            )}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <SidebarMenu isActive={isActive} isCollapsed={isSidebarCollapsed} />
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-base-100 border border-base-300 rounded-full p-1.5 shadow-lg hover:bg-base-200 transition-colors z-10"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={16} className="text-base-content" />
          ) : (
            <ChevronLeft size={16} className="text-base-content" />
          )}
        </button>
      </aside>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? '' : 'pointer-events-none'}`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        {/* Drawer */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 bg-base-100 shadow-xl flex flex-col transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Menu */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <SidebarMenu isActive={isActive} />
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="navbar bg-base-100 border-b border-base-200 px-4 lg:px-6 h-16 shrink-0 sticky top-0 z-30">
          <div className="flex-none lg:hidden">
            <button
              className="btn btn-square size-10 p-0 btn-ghost"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="flex-1 lg:ml-0 ml-2">
            <h2 className="text-sm font-medium text-base-content/60 truncate">
              {t('welcome', { name: adminUser.name || adminUser.username })}
            </h2>
          </div>

          <div className="flex-none gap-2 flex items-center">
            <div className="hidden sm:block">
              <ThemeToggler />
            </div>
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            {adminUser.isSuperuser && (
              <div className="badge badge-accent badge-sm font-bold tracking-tight hidden md:flex">
                {t('superuser')}
              </div>
            )}
            <div className="divider divider-horizontal mx-0 hidden sm:flex"></div>
            <button
              onClick={() => logout()}
              className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-base-200/50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}
