'use client'

import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, LogOut, User, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function UserProfile() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('user_profile')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [isOpen])

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="btn btn-ghost gap-3"
      >
        {session.user.image ? (
          <div className="avatar">
            <div className="w-10 rounded-full">
              <Image
                src={session.user.image}
                alt={session.user.name || t('default_user')}
                width={40}
                height={40}
              />
            </div>
          </div>
        ) : (
          <div className="avatar">
            <div className="avatar-placeholder bg-primary text-primary-content rounded-full w-10 flex items-center justify-center">
              <span>{session.user.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
          </div>
        )}
        <div className="hidden text-left md:block">
          <p className="text-sm font-semibold">{session.user.name}</p>
          <p className="text-xs text-base-content/70">{session.user.email}</p>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute right-0 top-full mt-2 z-50 w-64 rounded-box bg-base-100 p-2 shadow-xl border border-base-200 menu">
          <li className="menu-title px-4 py-2 border-b border-base-200 mb-2">
            <span className="font-bold text-base-content uppercase tracking-wider">
              {session.user.name}
            </span>
            <span className="text-xs font-normal opacity-50">{session.user.email}</span>
          </li>

          <li>
            <Link href="/user/settings/profile" onClick={() => setIsOpen(false)} className="py-3">
              <User className="h-5 w-5" />
              {t('profile_tab')}
            </Link>
          </li>
          <li>
            <Link href="/user/settings/security" onClick={() => setIsOpen(false)} className="py-3">
              <ShieldCheck className="h-5 w-5" />
              {t('security_tab')}
            </Link>
          </li>
          <li>
            <Link href="/user/orders" onClick={() => setIsOpen(false)} className="py-3">
              <ShoppingBag className="h-5 w-5" />
              {t('orders_tab')}
            </Link>
          </li>

          <div className="divider my-1"></div>

          <li>
            <button onClick={handleSignOut} className="py-3 text-error hover:bg-error/10">
              <LogOut className="h-5 w-5" />
              {t('logout')}
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
