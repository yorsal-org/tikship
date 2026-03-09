'use client'

import { useState, useEffect } from 'react'
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
  const [name, setName] = useState(() => session?.user?.name || '')
  const [image, setImage] = useState(() => session?.user?.image || '')

  useEffect(() => {
    if (session?.user) {
      const newName = session.user.name || ''
      const newImage = session.user.image || ''
      if (newName !== name) setName(newName)
      if (newImage !== image) setImage(newImage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name, session?.user?.image])

  const profileApi = useApi('/api/user/me', 'PATCH')

  const handleSave = async () => {
    await profileApi.request(
      { name, image },
      {
        onSuccess: async () => {
          toast.success(t('update_success'))
          // Update local session
          await update({
            ...session,
            user: {
              ...session?.user,
              name,
              image,
            },
          })
        },
        onError: (err: string) => {
          toast.error(err || t('update_error'))
        },
      }
    )
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
