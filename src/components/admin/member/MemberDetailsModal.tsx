'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, Calendar, Users, Shield, Info, Clock, Fingerprint } from 'lucide-react'
import { format } from 'date-fns'
import { useApi } from '@/hooks/useApi'
import { MemberDetails, MemberDetailResponse } from '@/types/admin'
import Image from 'next/image'
import { Modal } from '@/components/ui/Modal'

interface MemberDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function MemberDetailsModal({ isOpen, onClose, userId }: MemberDetailsModalProps) {
  const t = useTranslations('admin.members')
  const [user, setUser] = useState<MemberDetails | null>(null)

  const memberApi = useApi<MemberDetailResponse>('', 'GET')

  const fetchUser = async () => {
    const { success, data: result } = await memberApi.request(undefined, {
      urlOverride: `/api/admin/members/${userId}`,
    })

    if (success && result) {
      setUser(result.user)
    }
  }

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary">
          <Info size={20} />
          {t('details')}
        </div>
      }
      maxWidth="2xl"
      showCloseButton
    >
      {memberApi.loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : user ? (
        <div className="space-y-8 p-2">
          <div className="flex items-center gap-6">
            <div className="avatar">
              <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center ring ring-primary ring-offset-2 ring-offset-base-100 relative overflow-hidden">
                {user.image ? (
                  <Image src={user.image} alt={user.name || ''} fill className="object-cover" />
                ) : (
                  <Users size={40} strokeWidth={1.5} />
                )}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{user.name || '-'}</h2>
                <div
                  className={`badge ${user.isActive ? 'badge-success' : 'badge-error'} badge-sm font-medium`}
                >
                  {user.isActive ? t('active') : t('inactive')}
                </div>
              </div>
              <div className="text-base-content/60 flex items-center gap-1.5 ring-1 ring-base-200 px-2 py-0.5 rounded-md w-fit bg-base-100">
                <Mail size={14} />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase text-base-content/40 tracking-widest flex items-center gap-2">
                <Info size={16} /> Basic Information
              </h4>
              <div className="space-y-3 bg-base-200/50 p-4 rounded-xl">
                <div className="text-sm flex justify-between items-center border-b border-base-200 pb-2 last:border-0 last:pb-0">
                  <span className="text-base-content/50 flex items-center gap-2 font-medium">
                    <Calendar size={14} /> Joined
                  </span>
                  <span className="font-semibold">
                    {format(new Date(user.createdAt), 'yyyy-MM-dd')}
                  </span>
                </div>
                <div className="text-sm flex justify-between items-center border-b border-base-200 pb-2 last:border-0 last:pb-0">
                  <span className="text-base-content/50 flex items-center gap-2 font-medium">
                    <Clock size={14} /> Last Login
                  </span>
                  <span className="font-semibold">
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), 'yyyy-MM-dd HH:mm')
                      : '-'}
                  </span>
                </div>
                <div className="text-sm flex justify-between items-center border-b border-base-200 pb-2 last:border-0 last:pb-0">
                  <span className="text-base-content/50 flex items-center gap-2 font-medium">
                    <Users size={14} /> Total Logins
                  </span>
                  <span className="font-semibold tracking-tight">{user._count.loginAttempts}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase text-base-content/40 tracking-widest flex items-center gap-2">
                <Fingerprint size={16} /> Authentication
              </h4>
              <div className="bg-base-200/50 p-4 rounded-xl min-h-32">
                <p className="text-xs text-base-content/40 mb-3 font-medium">
                  Linked accounts and providers
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.accounts.length > 0 ? (
                    user.accounts.map(acc => (
                      <div
                        key={acc.provider}
                        className="badge badge-lg badge-outline gap-2 bg-base-100 border-base-300 py-4 px-4 font-bold uppercase text-xs tracking-wider"
                      >
                        <Shield size={12} className="text-primary" />
                        {acc.provider}
                      </div>
                    ))
                  ) : (
                    <div className="badge badge-lg badge-outline gap-2 bg-base-100 border-base-300 py-4 px-4 font-bold uppercase text-xs tracking-wider">
                      <Mail size={12} className="text-primary" />
                      Credentials
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-error">Failed to load user data</div>
      )}

      <div className="modal-action">
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
