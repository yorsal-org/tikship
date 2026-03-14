'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import SecurityEditor from '@/components/user/SecurityEditor'

export default function SecuritySettingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const t = useTranslations('home')
  const pt = useTranslations('user_profile')

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{pt('security_tab')}</h1>
        <p className="text-base-content/60">{t('profile_section_desc')}</p>
      </div>
      <div className="pt-4 border-t border-base-200">
        <SecurityEditor />
      </div>
    </div>
  )
}
