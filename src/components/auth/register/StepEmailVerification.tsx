'use client'

import { useState, useEffect } from 'react'
import { Mail, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { useApi } from '@/hooks/useApi'

interface StepEmailVerificationProps {
  onNext: (email: string, token: string) => void
}

interface VerifyCodeResponse {
  token: string
}

export default function StepEmailVerification({ onNext }: StepEmailVerificationProps) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [countdown, setCountdown] = useState(0)
  const t = useTranslations('register')

  const sendCodeApi = useApi('/api/auth/register/send-code')
  const verifyCodeApi = useApi<VerifyCodeResponse>('/api/auth/register/verify-code')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    const { success } = await sendCodeApi.request({ email })
    if (success) {
      setStep('code')
      setCountdown(60)
    }
  }

  const handleVerifyCode = async () => {
    const result = await verifyCodeApi.request({ email, code })
    if (result.success && 'data' in result && result.data.token) {
      onNext(email, result.data.token)
    }
  }

  return (
    <Card
      title={
        <>
          <Mail className="w-6 h-6 mr-2" />
          {t('email_verify_title')}
        </>
      }
      className="max-w-md w-full"
    >
      {step === 'email' ? (
        <div className="space-y-4">
          <Input
            label={t('email_label')}
            type="email"
            placeholder={t('email_placeholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={sendCodeApi.loading}
          />

          {sendCodeApi.error && <Alert variant="error">{sendCodeApi.error}</Alert>}

          <div className="card-actions justify-end">
            <Button
              loading={sendCodeApi.loading}
              onClick={handleSendCode}
              disabled={!email || sendCodeApi.loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('send_code')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="info">{t('code_sent', { email })}</Alert>

          <Input
            label={t('code_label')}
            type="text"
            placeholder={t('code_placeholder')}
            className="text-center text-2xl tracking-widest"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={verifyCodeApi.loading}
            maxLength={6}
            hint={t('code_hint')}
          />

          {(sendCodeApi.error || verifyCodeApi.error) && (
            <Alert variant="error">{verifyCodeApi.error || sendCodeApi.error}</Alert>
          )}

          <div className="card-actions justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleSendCode}
              disabled={countdown > 0 || sendCodeApi.loading}
              size="sm"
            >
              {countdown > 0 ? t('resend_wait', { seconds: countdown }) : t('resend')}
            </Button>
            <Button
              loading={verifyCodeApi.loading}
              onClick={handleVerifyCode}
              disabled={code.length !== 6 || verifyCodeApi.loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('verify')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
