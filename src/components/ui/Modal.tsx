'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string | ReactNode
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = false,
}: ModalProps) {
  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }

  return (
    <div className="modal modal-open">
      <div className={`modal-box ${maxWidthClasses[maxWidth]}`}>
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center mb-4">
            {title && <h3 className="text-lg font-bold">{title}</h3>}
            {showCloseButton && (
              <button className="btn btn-sm btn-circle btn-ghost ml-auto" onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
