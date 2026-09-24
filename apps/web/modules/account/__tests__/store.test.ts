import { beforeEach, describe, expect, it } from 'vitest'

import { useRecentlyViewedStore } from '../core/store'

describe('useRecentlyViewedStore', () => {
  beforeEach(() => {
    useRecentlyViewedStore.setState({ gameIds: [] })
  })

  it('records a view, most recent first', () => {
    useRecentlyViewedStore.getState().recordView(1)
    useRecentlyViewedStore.getState().recordView(2)

    expect(useRecentlyViewedStore.getState().gameIds).toStrictEqual([2, 1])
  })

  it('moves a repeat view to the front instead of duplicating it', () => {
    useRecentlyViewedStore.getState().recordView(1)
    useRecentlyViewedStore.getState().recordView(2)
    useRecentlyViewedStore.getState().recordView(1)

    expect(useRecentlyViewedStore.getState().gameIds).toStrictEqual([1, 2])
  })

  it('caps the list at 10 entries', () => {
    for (let id = 1; id <= 11; id++) {
      useRecentlyViewedStore.getState().recordView(id)
    }

    const gameIds = useRecentlyViewedStore.getState().gameIds
    expect(gameIds).toHaveLength(10)
    expect(gameIds[0]).toBe(11)
    expect(gameIds).not.toContain(1)
  })
})
