'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Github, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface GithubSignInButtonProps {
  callbackUrl?: string
  className?: string
}

export function GithubSignInButton({ callbackUrl = '/', className = '' }: GithubSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('login')

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn('github', { callbackUrl })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`btn btn-neutral btn-block gap-3 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t('submitting')}</span>
        </>
      ) : (
        <>
          <Github className="h-5 w-5" />
          <span>{t('github_login')}</span>
        </>
      )}
    </button>
  )
}
