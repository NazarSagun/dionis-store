import { OrderObject } from '@repo/dionis-api/src/model'

export function isGameOwned(orders: OrderObject[] | undefined, gameId: number, editionId: number | null): boolean {
  if (!orders) return false
  return orders.some((order) =>
    (order.items ?? []).some((item) => item.gameId === gameId && (item.editionId ?? null) === editionId),
  )
}
