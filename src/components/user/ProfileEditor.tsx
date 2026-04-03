'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/lib/utils/toast'
import AvatarUpload from '@/components/auth/register/AvatarUpload'
import { useApi } from '@/hooks/useApi'

export default function ProfileEditor() {
  const { data: session, update } = useSession()
  const t = useTranslations('user_profile')

  // Local state for form inputs - initialized from session
  const [name, setName] = useState(session?.user?.name || '')
  const [image, setImage] = useState(session?.user?.image || '')

  const profileApi = useApi('/api/user/me', 'PATCH')

  const handleSave = async () => {
    const result = await profileApi.request({ name, image })

    if (result.success) {
      toast.success(t('update_success'))
      // Sync session with new values after successful API call
      await update({ ...session, user: { ...session?.user, name, image } })
    } else {
      toast.error(result.error || t('update_error'))
    }
  }

  return (
    <div className="flex flex-col gap-10 max-w-md">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <AvatarUpload value={image} onUpload={url => setImage(url)} />
      </div>

      <Input
        label={t('name_label')}
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('name_label')}
        disabled={profileApi.loading}
        leftIcon={<User className="w-5 h-5" />}
      />

      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            loading={profileApi.loading}
            variant="primary"
            className="w-full sm:w-auto px-8"
            leftIcon={!profileApi.loading && <CheckCircle2 className="w-4 h-4" />}
          >
            {t('save_changes')}
          </Button>
        </div>
      </div>
    </div>
  )
}
