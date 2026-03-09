'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAdminAuth } from '@/components/providers/AdminAuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/lib/utils/toast'

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
      router.push('/admin')
    } catch (err) {
      // Error message is already translated from API
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold">{t('title')}</h2>
          <p className="text-sm text-base-content/70">{t('subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label={t('username')}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('username')}
              required
              disabled={isLoading}
            />

            <Input
              label={t('password')}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('password')}
              required
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading} loading={isLoading}>
              {isLoading ? t('signing_in') : t('sign_in')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
