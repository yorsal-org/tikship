'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { siteConfig } from '@/config/site'
import { useApi } from '@/hooks/useApi'
import {
  adminDashboardItem,
  adminMenuConfig,
  type AdminMenuItem,
  type AdminMenuGroup,
} from '@/config/admin-menu'

interface SidebarMenuProps {
  isActive: (path: string) => boolean
  isCollapsed?: boolean
}

interface ModuleState {
  content: boolean
  commerce: boolean
  user: boolean
}

function MenuLink({
  item,
  href,
  isActive,
  isCollapsed,
  label,
}: {
  item: AdminMenuItem
  href: string
  isActive: (path: string) => boolean
  isCollapsed?: boolean
  label: string
}) {
  const Icon = item.icon
  return (
    <Link
      href={href}
      className={
        isActive(href)
          ? 'bg-primary text-primary-content font-bold shadow-md'
          : 'hover:bg-base-200'
      }
      title={isCollapsed ? label : ''}
    >
      <Icon size={18} />
      {!isCollapsed && label}
    </Link>
  )
}

function MenuGroup({
  group,
  isActive,
  isCollapsed,
}: {
  group: AdminMenuGroup
  isActive: (path: string) => boolean
  isCollapsed?: boolean
}) {
  const t = useTranslations('admin.layout')
  const adminPath = siteConfig.admin.path

  return (
    <>
      {!isCollapsed && (
        <li className="menu-title mt-6 border-t border-base-200 pt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-base-content/40">
          {t(group.groupKey)}
        </li>
      )}
      {isCollapsed && <li className="mt-4 border-t border-base-200"></li>}
      {group.items.map((item) => (
        <li key={item.path}>
          <MenuLink
            item={item}
            href={`${adminPath}/${item.path}`}
            isActive={isActive}
            isCollapsed={isCollapsed}
            label={t(item.labelKey)}
          />
        </li>
      ))}
    </>
  )
}

export function SidebarMenu({ isActive, isCollapsed = false }: SidebarMenuProps) {
  const t = useTranslations('admin.layout')
  const adminPath = siteConfig.admin.path
  const [enabledGroups, setEnabledGroups] = useState<AdminMenuGroup[]>(adminMenuConfig)
  const [isLoading, setIsLoading] = useState(true)

  const moduleStateApi = useApi<ModuleState>('/api/admin/modules/state', 'GET')

  useEffect(() => {
    fetchModuleState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchModuleState = async () => {
    try {
      const result = await moduleStateApi.request(undefined)
      if (result.success && result.data) {
        const filtered = adminMenuConfig.filter(group => {
          if (group.groupKey === 'group_content' && !result.data!.content) return false
          if (group.groupKey === 'group_commerce' && !result.data!.commerce) return false
          if (group.groupKey === 'group_user' && !result.data!.user) return false
          return true
        })
        setEnabledGroups(filtered)
      }
    } catch (error) {
      console.error('Failed to fetch module state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <ul className="menu menu-md p-0 gap-1">
        <li>
          <div className="flex items-center justify-center py-4">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        </li>
      </ul>
    )
  }

  return (
    <ul className="menu menu-md p-0 gap-1">
      {/* Dashboard */}
      <li>
        <MenuLink
          item={adminDashboardItem}
          href={adminPath}
          isActive={isActive}
          isCollapsed={isCollapsed}
          label={t(adminDashboardItem.labelKey)}
        />
      </li>

      {/* Dynamic menu groups */}
      {enabledGroups.map((group) => (
        <MenuGroup
          key={group.groupKey}
          group={group}
          isActive={isActive}
          isCollapsed={isCollapsed}
        />
      ))}
    </ul>
  )
}
