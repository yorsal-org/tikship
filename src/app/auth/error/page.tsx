'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

function AuthErrorContent() {
  const t = useTranslations('auth_error')
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error') || 'Default'

  return (
    <div className="grow flex items-center justify-center bg-linear-to-br from-error/10 via-base-100 to-primary/10 px-4 py-12 relative overflow-hidden">
      {/* Background Orbs for Rich Aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-error/20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '2s' }}
      ></div>

      <Card
        className="w-full max-w-md animate-in fade-in zoom-in duration-500"
        glass
        bodyClassName="items-center text-center p-8"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-error/20 rounded-full blur-xl animate-ping opacity-50"></div>
          <div className="relative bg-error/10 p-4 rounded-full text-error border border-error/20">
            <ShieldAlert size={48} strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight mb-6 text-base-content">
          {t('title')}
        </h2>

        <Alert variant="error" className="mb-6 text-left">
          {t(`messages.${error}`) || t('messages.Default')}
        </Alert>

        {error === 'OAuthAccountNotLinked' && (
          <Alert variant="warning" className="mb-6 text-left">
            <div className="text-sm">
              <span className="font-bold block mb-1">{t('hint')}</span>
              <span className="opacity-90">{t('OAuthAccountNotLinked_hint')}</span>
            </div>
          </Alert>
        )}

        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={() => router.push('/login')}
            variant="primary"
            size="lg"
            leftIcon={<ArrowLeft size={20} />}
            fullWidth
            className="font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {t('back_to_login')}
          </Button>
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            size="lg"
            leftIcon={<Home size={18} />}
            fullWidth
            className="font-semibold"
          >
            {t('back_to_home')}
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-6 border-t border-base-200 w-full text-left">
            <div className="badge badge-outline badge-sm gap-1.5 opacity-50 font-mono py-3 px-3">
              <span className="font-bold">{t('error_code')}:</span>
              {error}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense
      fallback={
        <div className="grow flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
