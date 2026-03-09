interface StatusBadgeProps {
  status: string
  variant?: 'success' | 'error' | 'warning' | 'info' | 'ghost'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusBadge({
  status,
  variant = 'ghost',
  label,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const variantClass = {
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
    ghost: 'badge-ghost',
  }[variant]

  const sizeClass = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg',
  }[size]

  return (
    <span className={`whitespace-nowrap badge ${variantClass} ${sizeClass} ${className}`.trim()}>
      {label || status}
    </span>
  )
}
