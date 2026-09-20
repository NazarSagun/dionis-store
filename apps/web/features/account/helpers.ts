// Order and OrderItem prices come back from the API in cents (see
// apps/api orders.service.ts's calculateUnitPriceCents), unlike the catalog
// and cart, which use plain currency units. Every account-area price display
// must go through this before rendering.
export function formatCentsToEuros(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function formatOrderDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}
