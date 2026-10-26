// Order and OrderItem prices come back from the API in cents (see
// apps/api orders.service.ts's calculateUnitPriceCents), unlike the catalog
// and cart, which use plain currency units. Every account-area price display
// must go through this before rendering.
export function formatCentsToEuros(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function formatOrderDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export type OrderStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
}

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'border-border text-muted-foreground',
  SHIPPED: 'border-foreground text-foreground',
  DELIVERED: 'border-success text-success',
}

export function orderStatusBadgeClass(status: OrderStatus) {
  return `rounded-full border px-2.5 py-1 font-sans text-xs ${ORDER_STATUS_COLORS[status]}`
}

// A physical edition ships. A digital-only order has nothing to track.
export function isPhysicalOrder(order: { items?: Array<{ editionId?: number | null }> }) {
  return (order.items ?? []).some((item) => item.editionId != null)
}
