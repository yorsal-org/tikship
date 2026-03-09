import { getTranslations } from 'next-intl/server'
import ProfileEditor from '@/components/user/ProfileEditor'

export default async function ProfileSettingsPage() {
  const t = await getTranslations('home')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{t('profile_section_title')}</h1>
        <p className="text-base-content/60">{t('profile_section_desc')}</p>
      </div>
      <div className="pt-4 border-t border-base-200">
        <ProfileEditor />
      </div>
    </div>
  )
}
