// The API takes at most 30 seed ids and 60 excluded ids.
export const MAX_SEED_IDS = 30
export const MAX_EXCLUDE_IDS = 60
export const RECOMMENDATIONS_LIMIT = 6

const unique = (ids: number[]) => [...new Set(ids)]

// The game on the page first, so it always seeds, then the recently viewed games.
export function detailPageSeeds(gameId: number, recentlyViewed: number[]): number[] {
  return unique([gameId, ...recentlyViewed]).slice(0, MAX_SEED_IDS)
}

export function excludedIds(...groups: number[][]): number[] {
  return unique(groups.flat()).slice(0, MAX_EXCLUDE_IDS)
}
