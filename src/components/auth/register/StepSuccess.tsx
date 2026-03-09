'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function StepSuccess() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)
  const t = useTranslations('register')

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="card bg-base-100 shadow-xl max-w-md w-full">
      <div className="card-body items-center text-center">
        <div className="mb-6">
          <CheckCircle className="w-24 h-24 text-success animate-bounce" />
        </div>

        <h2 className="card-title text-3xl mb-2">{t('success_title')}</h2>
        <p className="text-base-content/70 mb-6">{t('success_desc')}</p>

        <div className="alert alert-info mb-6">
          <span>{t('redirect_hint', { seconds: countdown })}</span>
        </div>

        <div className="card-actions">
          <button className="btn btn-primary" onClick={() => router.push('/')}>
            <Home className="w-4 h-4" />
            {t('go_home')}
          </button>
        </div>
      </div>
    </div>
  )
}
