/**
 * Badge utility functions for consistent badge styling
 */

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'ghost'

/**
 * Get badge variant based on boolean status
 * @param isActive - Whether the status is active
 * @returns Badge variant
 */
export function getStatusBadgeVariant(isActive: boolean): BadgeVariant {
  return isActive ? 'success' : 'error'
}

/**
 * Get badge variant for order status
 * @param status - Order status
 * @returns Badge variant
 */
export function getOrderStatusVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    pending: 'warning',
    completed: 'success',
    failed: 'error',
    refunded: 'ghost',
  }
  return statusMap[status] || 'ghost'
}

/**
 * Get badge variant for audit log action
 * @param action - Audit log action
 * @returns Badge variant
 */
export function getAuditActionVariant(action: string): BadgeVariant {
  if (action.includes('CREATE')) return 'success'
  if (action.includes('UPDATE')) return 'info'
  if (action.includes('DELETE')) return 'error'
  if (action.includes('LOGIN_SUCCESS')) return 'success'
  if (action.includes('LOGIN_FAILED')) return 'warning'
  return 'ghost'
}

/**
 * Get badge class name from variant
 * @param variant - Badge variant
 * @returns Badge class name
 */
export function getBadgeClassName(variant: BadgeVariant): string {
  const variantMap: Record<BadgeVariant, string> = {
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
    ghost: 'badge-ghost',
  }
  return variantMap[variant]
}
