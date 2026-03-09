'use client'

import { useState } from 'react'
import StepEmailVerification from '@/components/auth/register/StepEmailVerification'
import StepUserInfo from '@/components/auth/register/StepUserInfo'
import StepSuccess from '@/components/auth/register/StepSuccess'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const t = useTranslations('register')

  const handleEmailVerified = (verifiedEmail: string, verificationToken: string) => {
    setEmail(verifiedEmail)
    setToken(verificationToken)
    setCurrentStep(2)
  }

  const handleRegistrationComplete = () => {
    setCurrentStep(3)
  }

  return (
    <div className="grow flex flex-col items-center justify-center bg-linear-to-br from-primary/10 via-base-100 to-secondary/10 p-4 py-12">
      {/* Progress Steps */}
      <div className="mb-8">
        <ul className="steps">
          <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>
            <span className="min-w-30">{t('step_email')}</span>
          </li>
          <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>
            <span className="min-w-30">{t('step_info')}</span>
          </li>
          <li className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>
            <span className="min-w-30">{t('step_success')}</span>
          </li>
        </ul>
      </div>

      {/* Step Content */}
      {currentStep === 1 && <StepEmailVerification onNext={handleEmailVerified} />}
      {currentStep === 2 && (
        <StepUserInfo email={email} token={token} onNext={handleRegistrationComplete} />
      )}
      {currentStep === 3 && <StepSuccess />}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-base-content/60">
          {t('has_account')}{' '}
          <a href="/login" className="link link-primary">
            {t('login_now')}
          </a>
        </p>
      </div>
    </div>
  )
}
