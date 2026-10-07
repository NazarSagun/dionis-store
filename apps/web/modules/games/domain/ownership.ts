import { OwnedItem } from '../integration/repository'

// editionId is null for a digital purchase.
export function isGameOwned(owned: OwnedItem[] | undefined, gameId: number, editionId: number | null): boolean {
  if (!owned) return false
  return owned.some((item) => item.gameId === gameId && (item.editionId ?? null) === editionId)
}
