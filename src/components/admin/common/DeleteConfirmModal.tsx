'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  warning?: string
  loading?: boolean
  confirmText?: string
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  loading,
  confirmText,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Delete'} maxWidth="md">
      <p className="py-4">{message}</p>
      {warning && (
        <div className="alert alert-warning">
          <span>{warning}</span>
        </div>
      )}
      <div className="modal-action">
        <Button onClick={onClose} className="btn-ghost">
          Cancel
        </Button>
        <Button onClick={onConfirm} className="btn-error" loading={loading} disabled={loading}>
          {confirmText || 'Delete'}
        </Button>
      </div>
    </Modal>
  )
}
