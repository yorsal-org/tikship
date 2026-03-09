'use client'

import { useEffect, useState, useCallback } from 'react'
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils/common'
import { toast, type ToastVariant, type ToastData, type ToastPosition } from '@/lib/utils/toast'

interface ToastItemProps {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
  onClose: () => void
  position: ToastPosition
}

const icons = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
}

function ToastItem({
  message,
  variant = 'info',
  duration = 3000,
  onClose,
  position,
}: ToastItemProps) {
  const [active, setActive] = useState(false)

  const handleClose = useCallback(() => {
    setActive(false)
    setTimeout(() => onClose(), 300)
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => setActive(true), 10)
    const autoHideTimer = setTimeout(() => handleClose(), duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(autoHideTimer)
    }
  }, [duration, handleClose])

  const isTop = position.startsWith('top')

  return (
    <div
      className={cn(
        'alert shadow-xl flex items-center gap-3 pr-2 min-w-75 transition-all duration-300 ease-[cubic-bezier(0.18,0.89,0.32,1.28)]',
        `alert-${variant}`,
        'border-none',
        active
          ? 'opacity-100 translate-y-0 scale-100'
          : `opacity-0 scale-90 ${isTop ? '-translate-y-4' : 'translate-y-4'}`
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        {icons[variant]}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={handleClose}
        className="btn btn-ghost btn-xs btn-circle opacity-60 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const positionClasses: Record<ToastPosition, string> = {
  'top-start': 'toast-top toast-start',
  'top-center': 'toast-top toast-center',
  'top-end': 'toast-top toast-end',
  'bottom-start': 'toast-bottom toast-start',
  'bottom-center': 'toast-bottom toast-center',
  'bottom-end': 'toast-bottom toast-end',
}

export function ToastContainer() {
  const [activeToast, setActiveToast] = useState<ToastData | null>(null)

  useEffect(() => {
    const unsubscribe = toast.subscribe(newToast => {
      // Small delay to ensure the exit animation of the previous toast can potentially play
      // or just replace it immediately.
      setActiveToast(newToast)
    })
    return () => unsubscribe()
  }, [])

  const removeToast = useCallback(() => {
    setActiveToast(null)
  }, [])

  if (!activeToast) return null

  const pos = activeToast.position || 'top-center'

  return (
    <div className={cn('toast z-999 p-4', positionClasses[pos])}>
      <ToastItem
        key={activeToast.id}
        id={activeToast.id}
        message={activeToast.message}
        variant={activeToast.type}
        onClose={removeToast}
        duration={activeToast.duration}
        position={pos}
      />
    </div>
  )
}
