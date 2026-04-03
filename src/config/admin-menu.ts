import {
  LayoutDashboard,
  FileCode,
  FileText,
  History,
  Key,
  MessageSquare,
  Settings,
  Package,
  ShieldCheck,
  ShoppingCart,
  Tags,
  UserSquare2,
  Users,
} from 'lucide-react'

export interface AdminMenuItem {
  path: string
  icon: React.ComponentType<{ size?: number }>
  labelKey: string
}

export interface AdminMenuGroup {
  groupKey: string
  items: AdminMenuItem[]
}

export const adminMenuConfig: AdminMenuGroup[] = [
  {
    groupKey: 'group_content',
    items: [
      { path: 'articles', icon: FileText, labelKey: 'articles' },
      { path: 'categories', icon: Tags, labelKey: 'categories' },
      { path: 'pages', icon: FileCode, labelKey: 'pages' }
    ],
  },
  {
    groupKey: 'group_commerce',
    items: [
      { path: 'products', icon: Package, labelKey: 'products' },
      { path: 'orders', icon: ShoppingCart, labelKey: 'orders' }
    ],
  },
  {
    groupKey: 'group_user',
    items: [
      { path: 'members', icon: Users, labelKey: 'members' }
    ],
  },
  {
    groupKey: 'group_social',
    items: [
      { path: 'social/comments', icon: MessageSquare, labelKey: 'comments' },
    ],
  },
  {
    groupKey: 'group_system',
    items: [
      { path: 'users', icon: UserSquare2, labelKey: 'users' },
      { path: 'roles', icon: ShieldCheck, labelKey: 'roles' },
      { path: 'permissions', icon: Key, labelKey: 'permissions' },
      { path: 'audit-logs', icon: History, labelKey: 'audit_logs' },
      { path: 'settings', icon: Settings, labelKey: 'settings' },
    ],
  }
]

export const adminDashboardItem: AdminMenuItem = {
  path: '',
  icon: LayoutDashboard,
  labelKey: 'dashboard',
}
