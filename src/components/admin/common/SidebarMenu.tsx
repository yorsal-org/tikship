import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  ShieldCheck,
  Key,
  History,
  FileText,
  Tags,
  FileCode,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { siteConfig } from '@/config/site'

interface SidebarMenuProps {
  isActive: (path: string) => boolean
  isCollapsed?: boolean
}

export function SidebarMenu({ isActive, isCollapsed = false }: SidebarMenuProps) {
  const t = useTranslations('admin.layout')
  const adminPath = siteConfig.admin.path

  return (
    <ul className="menu menu-md p-0 gap-1">
      <li>
        <Link
          href={adminPath}
          className={
            isActive(adminPath)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('dashboard') : ''}
        >
          <LayoutDashboard size={18} />
          {!isCollapsed && t('dashboard')}
        </Link>
      </li>

      {!isCollapsed && (
        <li className="menu-title mt-6 border-t border-base-200 pt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-base-content/40">
          {t('group_content')}
        </li>
      )}
      {isCollapsed && <li className="mt-4 border-t border-base-200"></li>}

      <li>
        <Link
          href={`${adminPath}/articles`}
          className={
            isActive(`${adminPath}/articles`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('articles') : ''}
        >
          <FileText size={18} />
          {!isCollapsed && t('articles')}
        </Link>
      </li>
      <li>
        <Link
          href={`${adminPath}/categories`}
          className={
            isActive(`${adminPath}/categories`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('categories') : ''}
        >
          <Tags size={18} />
          {!isCollapsed && t('categories')}
        </Link>
      </li>
      <li>
        <Link
          href={`${adminPath}/pages`}
          className={
            isActive(`${adminPath}/pages`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('pages') : ''}
        >
          <FileCode size={18} />
          {!isCollapsed && t('pages')}
        </Link>
      </li>

      {!isCollapsed && (
        <li className="menu-title mt-6 border-t border-base-200 pt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-base-content/40">
          {t('group_commerce')}
        </li>
      )}
      {isCollapsed && <li className="mt-4 border-t border-base-200"></li>}

      <li>
        <Link
          href={`${adminPath}/products`}
          className={
            isActive(`${adminPath}/products`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('products') : ''}
        >
          <Package size={18} />
          {!isCollapsed && t('products')}
        </Link>
      </li>
      <li>
        <Link
          href={`${adminPath}/orders`}
          className={
            isActive(`${adminPath}/orders`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('orders') : ''}
        >
          <ShoppingCart size={18} />
          {!isCollapsed && t('orders')}
        </Link>
      </li>

      {!isCollapsed && (
        <li className="menu-title mt-6 border-t border-base-200 pt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-base-content/40">
          {t('group_user')}
        </li>
      )}
      {isCollapsed && <li className="mt-4 border-t border-base-200"></li>}

      <li>
        <Link
          href={`${adminPath}/members`}
          className={
            isActive(`${adminPath}/members`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('members') : ''}
        >
          <Users size={18} />
          {!isCollapsed && t('members')}
        </Link>
      </li>

      {!isCollapsed && (
        <li className="menu-title mt-6 border-t border-base-200 pt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-base-content/40">
          {t('group_system')}
        </li>
      )}
      {isCollapsed && <li className="mt-4 border-t border-base-200"></li>}

      <li>
        <Link
          href={`${adminPath}/users`}
          className={
            isActive(`${adminPath}/users`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('users') : ''}
        >
          <UserSquare2 size={18} />
          {!isCollapsed && t('users')}
        </Link>
      </li>
      <li>
        <Link
          href={`${adminPath}/roles`}
          className={
            isActive(`${adminPath}/roles`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('roles') : ''}
        >
          <ShieldCheck size={18} />
          {!isCollapsed && t('roles')}
        </Link>
      </li>
      <li>
        <Link
          href={`${adminPath}/permissions`}
          className={
            isActive(`${adminPath}/permissions`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('permissions') : ''}
        >
          <Key size={18} />
          {!isCollapsed && t('permissions')}
        </Link>
      </li>
      <li>
        <Link
          href={`${adminPath}/audit-logs`}
          className={
            isActive(`${adminPath}/audit-logs`)
              ? 'bg-primary text-primary-content font-bold shadow-md'
              : 'hover:bg-base-200'
          }
          title={isCollapsed ? t('audit_logs') : ''}
        >
          <History size={18} />
          {!isCollapsed && t('audit_logs')}
        </Link>
      </li>
    </ul>
  )
}
