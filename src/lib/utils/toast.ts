import { ToastVariant, ToastPosition, ToastData } from '@/types/ui'

export type { ToastVariant, ToastPosition, ToastData }

type ToastListener = (toast: ToastData) => void

class ToastManager {
  private listeners: Set<ToastListener> = new Set()

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(toast: ToastData) {
    this.listeners.forEach(listener => listener(toast))
  }

  show(
    type: ToastVariant,
    message: string,
    duration = 3000,
    position: ToastPosition = 'top-center'
  ) {
    const toast: ToastData = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      duration,
      position,
    }
    this.notify(toast)
    return toast.id
  }

  success(message: string, duration?: number, position?: ToastPosition) {
    return this.show('success', message, duration, position)
  }

  error(message: string, duration?: number, position?: ToastPosition) {
    const msg =
      typeof message === 'string'
        ? message
        : (message as { message?: string })?.message || String(message)
    return this.show('error', msg, duration, position)
  }

  info(message: string, duration?: number, position?: ToastPosition) {
    return this.show('info', message, duration, position)
  }

  warning(message: string, duration?: number, position?: ToastPosition) {
    return this.show('warning', message, duration, position)
  }
}

export const toast = new ToastManager()
