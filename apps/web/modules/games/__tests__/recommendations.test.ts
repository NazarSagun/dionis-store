import { describe, expect, it } from 'vitest'

import { detailPageSeeds, excludedIds, MAX_EXCLUDE_IDS, MAX_SEED_IDS } from '../domain/recommendations'

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
