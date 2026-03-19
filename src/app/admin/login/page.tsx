'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAdminAuth } from '@/components/providers/AdminAuthProvider'
import { toast } from '@/lib/utils/toast'
import { siteConfig } from '@/config/site'
import { Logo } from '@/components/ui/Logo'
import { Loader2, Lock, User, ShieldCheck, Terminal, Activity, Users } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const t = useTranslations('admin.login')
  const { login } = useAdminAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(username, password)
      router.push(siteConfig.admin.path)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-base-300">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Top: brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Logo className="h-12 w-auto text-primary" />
          </div>
          <p className="text-sm">{siteConfig.description.split('.')[0]}.</p>
        </div>

        {/* Middle: feature highlights */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Admin Control Center</h2>
            <p className="text-sm">Manage every aspect of your SaaS platform from one place.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: <Users className="w-5 h-5" />,
                title: 'User Management',
                desc: 'View, edit, and manage all registered users and their roles.',
              },
              {
                icon: <Activity className="w-5 h-5" />,
                title: 'Real-time Analytics',
                desc: 'Track revenue, orders, and platform activity at a glance.',
              },
              {
                icon: <Terminal className="w-5 h-5" />,
                title: 'System Configuration',
                desc: 'Control payments, themes, i18n, and site settings.',
              },
              {
                icon: <ShieldCheck className="w-5 h-5" />,
                title: 'Restricted Access',
                desc: 'Role-based security ensures only admins can enter.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: copyright */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: 'oklch(38% 0.04 260)' }}>
            &copy; {new Date().getFullYear()} {siteConfig.name} &mdash; Restricted Access
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-base-200">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <Logo className="h-12 w-auto text-primary" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-base-content tracking-tight">{t('title')}</h1>
            <p className="mt-1 text-sm text-base-content/50">{t('subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-base-content/50">
                {t('username')}
              </label>
              <div
                className="flex items-center gap-0 border rounded-xl transition-all bg-base-100 focus-within:ring-2"
                style={{
                  borderColor: 'oklch(var(--b3))',
                }}
              >
                <div className="pl-3.5 text-base-content/30">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="admin"
                  autoComplete="username"
                  className="input border-none focus:ring-0 focus:outline-none grow bg-transparent h-11 text-sm"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-base-content/50">
                {t('password')}
              </label>
              <div
                className="flex items-center gap-0 border rounded-xl transition-all bg-base-100 focus-within:ring-2"
                style={{
                  borderColor: 'oklch(var(--b3))',
                }}
              >
                <div className="pl-3.5 text-base-content/30">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input border-none focus:ring-0 focus:outline-none grow bg-transparent h-11 text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              
              disabled={isLoading}
              className="w-full btn btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('signing_in')}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {t('sign_in')}
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-base-content/30">
            {siteConfig.name} &mdash; Admin Panel
          </p>
        </div>
      </div>
    </div>
  )
}
