import { describe, expect, it } from 'vitest'

import { aiFilterChips, toGamesFilters } from '../domain/ai-search'

describe('AI search result', () => {
  it('shows one chip per filter, in toolbar order, with the toolbar labels', () => {
    expect(
      aiFilterChips({
        edition: 'collector',
        sort: 'rating_desc',
        maxPrice: 20,
        genre: 'Shooter',
        platform: 'PS5',
        search: 'halo',
      }),
    ).toEqual([
      { key: 'search', label: 'Search: halo' },
      { key: 'platform', label: 'Platform: PS5' },
      { key: 'genre', label: 'Genre: Shooter' },
      { key: 'price', label: 'Price: Up to €20' },
      { key: 'sort', label: 'Sort: Rating (high to low)' },
      { key: 'edition', label: 'Edition: Collector' },
    ])
  })

  it('shows a free price range and nothing for missing filters', () => {
    expect(aiFilterChips({ minPrice: 0, maxPrice: 12 })).toEqual([{ key: 'price', label: 'Price: €0–€12' }])
    expect(aiFilterChips(undefined)).toEqual([])
  })

  it('replaces every current filter and starts at page 1', () => {
    expect(toGamesFilters({ platform: 'PC' })).toEqual({ page: 1, platform: 'PC' })
  })
})
