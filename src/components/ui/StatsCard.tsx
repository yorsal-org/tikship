'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  color?: string
}

export function StatCard({ label, value, icon: Icon, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-60">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {Icon && <Icon className={`w-8 h-8 ${color}`} />}
        </div>
      </div>
    </div>
  )
}

interface StatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  const colClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  }

  return <div className={`grid grid-cols-1 ${colClasses[columns]} gap-4`}>{children}</div>
}
