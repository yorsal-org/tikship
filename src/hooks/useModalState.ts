import { useState, useCallback } from 'react'

/**
 * Generic modal state management hook
 * Provides utilities for managing modal open/close state and selected item
 */
export function useModalState<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  const open = useCallback((item?: T) => {
    if (item !== undefined) {
      setSelectedItem(item)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setSelectedItem(null)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return {
    isOpen,
    selectedItem,
    open,
    close,
    toggle,
    setSelectedItem,
  }
}

/**
 * Multiple modal state management hook
 * Useful when you have multiple modals in a component
 */
export function useMultiModalState<T = unknown>() {
  const [modals, setModals] = useState<Record<string, boolean>>({})
  const [selectedItems, setSelectedItems] = useState<Record<string, T | null>>({})

  const open = useCallback((modalId: string, item?: T) => {
    setModals(prev => ({ ...prev, [modalId]: true }))
    if (item !== undefined) {
      setSelectedItems(prev => ({ ...prev, [modalId]: item }))
    }
  }, [])

  const close = useCallback((modalId: string) => {
    setModals(prev => ({ ...prev, [modalId]: false }))
    setSelectedItems(prev => ({ ...prev, [modalId]: null }))
  }, [])

  const isOpen = useCallback(
    (modalId: string) => {
      return modals[modalId] || false
    },
    [modals]
  )

  const getSelectedItem = useCallback(
    (modalId: string) => {
      return selectedItems[modalId] || null
    },
    [selectedItems]
  )

  return {
    open,
    close,
    isOpen,
    getSelectedItem,
  }
}
