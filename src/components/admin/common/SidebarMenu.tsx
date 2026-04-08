'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { siteConfig } from '@/config/site'
import { useModuleState } from '@/components/providers/ModuleStateProvider'
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
  const { moduleState, loading } = useModuleState()

  const enabledGroups = adminMenuConfig.filter(group => {
    if (!moduleState) return true
    if (group.groupKey === 'group_content' && !moduleState.content) return false
    if (group.groupKey === 'group_commerce' && !moduleState.commerce) return false
    if (group.groupKey === 'group_user' && !moduleState.user) return false
    if (group.groupKey === 'group_social' && !moduleState.social) return false
    return true
  })

  if (loading) {
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
