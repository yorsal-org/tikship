import { ReactNode } from 'react'
import { cn } from '@/lib/utils/common'

interface CardProps {
  children: ReactNode
  title?: ReactNode
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
  glass?: boolean
}

export function Card({
  children,
  title,
  actions,
  className,
  bodyClassName,
  shadow = 'xl',
  glass = false,
}: CardProps) {
  return (
    <div
      className={cn(
        'card',
        glass ? 'glass' : 'bg-base-100',
        shadow !== 'none' && `shadow-${shadow}`,
        className
      )}
    >
      <div className={cn('card-body', bodyClassName)}>
        {title && <h2 className="card-title text-2xl mb-2">{title}</h2>}
        {children}
        {actions && <div className="card-actions justify-end mt-4">{actions}</div>}
      </div>
    </div>
  )
}
