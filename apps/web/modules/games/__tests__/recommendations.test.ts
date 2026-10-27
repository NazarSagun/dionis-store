import { describe, expect, it } from 'vitest'

import { accountSeeds, detailPageSeeds, excludedIds, MAX_EXCLUDE_IDS, MAX_SEED_IDS } from '../domain/recommendations'

const ids = (count: number) => Array.from({ length: count }, (_, i) => i + 1)

describe('detailPageSeeds', () => {
  it('puts the game on the page first and adds the recently viewed games once', () => {
    expect(detailPageSeeds(5, [3, 5, 4])).toEqual([5, 3, 4])
  })

  it('keeps at most 30 seeds, and the game on the page stays', () => {
    const seeds = detailPageSeeds(999, ids(60))
    expect(seeds).toHaveLength(MAX_SEED_IDS)
    expect(seeds[0]).toBe(999)
  })
})

describe('excludedIds', () => {
  it('joins the groups without duplicates, and keeps at most 60', () => {
    expect(excludedIds([1, 2], [2, 3])).toEqual([1, 2, 3])
    expect(excludedIds(ids(100))).toHaveLength(MAX_EXCLUDE_IDS)
  })
})

describe('accountSeeds', () => {
  it('uses the recently viewed games with the viewed title', () => {
    expect(accountSeeds([1, 2, 2], [9])).toEqual({ seeds: [1, 2], title: 'Because you viewed' })
  })

  it('falls back to the owned games with the library title', () => {
    expect(accountSeeds([], [9, 8, 9])).toEqual({ seeds: [9, 8], title: 'Based on your library' })
  })

  it('has no seeds for a user with no views and no games', () => {
    expect(accountSeeds([], []).seeds).toEqual([])
  })
})
