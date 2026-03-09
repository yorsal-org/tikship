'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GoogleSignInButton } from '@/components/auth/login/GoogleSignInButton'
import { GithubSignInButton } from '@/components/auth/login/GithubSignInButton'
import { signIn } from 'next-auth/react'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = useTranslations('login')

  useEffect(() => {
    if (session) {
      router.push('/')
    }

    // Handle error from query params
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    if (errorParam) {
      if (errorParam === 'AccessDenied') {
        setError(t('account_disabled'))
      } else {
        setError(errorParam)
      }
      // Remove error from URL without refreshing
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [session, router, t])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push('/')
      }
    } catch {
      setError(t('error_generic'))
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grow flex items-center justify-center bg-linear-to-br from-primary/10 via-base-100 to-secondary/10 px-4 py-12">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center">
            <h1 className="text-4xl justify-center font-bold flex items-center gap-2">
              {t('welcome')} <Logo className="h-12 w-auto" />
            </h1>
            <p className="mt-3 text-sm text-base-content/70">{t('subtitle')}</p>
          </div>

          {/* Email/Password Login Form */}
          <form onSubmit={handleEmailLogin} className="mt-8 space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('email_label')}</span>
              </label>
              <div className="relative">
                <label className="input flex items-center gap-2 w-full focus-within:input-primary">
                  <Mail className="w-4 h-4 text-base-content/40" />
                  <input
                    type="email"
                    placeholder={t('email_placeholder')}
                    className="grow"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('password_label')}</span>
              </label>
              <div className="relative">
                <label className="input flex items-center gap-2 w-full focus-within:input-primary">
                  <Lock className="w-4 h-4 text-base-content/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('password_placeholder')}
                    className="grow"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-circle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-base-content/40" />
                    ) : (
                      <Eye className="w-4 h-4 text-base-content/40" />
                    )}
                  </button>
                </label>
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submit')
              )}
            </button>
          </form>

          <div className="divider">{t('or_divider')}</div>

          <div className="space-y-3">
            <GoogleSignInButton callbackUrl="/" />
            <GithubSignInButton callbackUrl="/" />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-base-content/70">
              {t('no_account')}{' '}
              <a href="/register" className="link link-primary">
                {t('register_now')}
              </a>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-base-content/70">
            {t('terms_privacy')}{' '}
            <a href="#" className="link link-primary">
              {t('terms')}
            </a>{' '}
            {t('and')}{' '}
            <a href="#" className="link link-primary">
              {t('privacy')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
