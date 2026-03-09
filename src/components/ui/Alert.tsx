import { ReactNode } from 'react'
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils/common'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  children: ReactNode
  variant?: AlertVariant
  icon?: ReactNode
  className?: string
}

const icons = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
}

export function Alert({ children, variant = 'info', icon, className }: AlertProps) {
  return (
    <div className={cn('alert', `alert-${variant}`, className)}>
      {icon || icons[variant]}
      <span>{children}</span>
    </div>
  )
}
