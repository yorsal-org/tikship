import { getTranslations } from 'next-intl/server'
import SecurityEditor from '@/components/user/SecurityEditor'

export default async function SecuritySettingsPage() {
  const t = await getTranslations('home')
  const pt = await getTranslations('user_profile')

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
