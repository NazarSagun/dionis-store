import { beforeEach, describe, expect, it } from 'vitest'

import { useWishlistStore } from '../core/store'

const mockItem = { id: 1, thumbnailUrl: 'test', title: 'title', price: 23, platform: 'PC', rating: '4.5', discount: 0 }

describe('useWishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [] })
  })

  it('Should add an item on first toggle', () => {
    useWishlistStore.getState().toggleItem(mockItem)

    const items = useWishlistStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject(mockItem)
  })

  it('Should remove the item on second toggle', () => {
    useWishlistStore.getState().toggleItem(mockItem)
    useWishlistStore.getState().toggleItem(mockItem)

    expect(useWishlistStore.getState().items).toStrictEqual([])
  })

  it('Should put the most recently added item first', () => {
    useWishlistStore.getState().toggleItem(mockItem)
    useWishlistStore.getState().toggleItem({ ...mockItem, id: 2 })

    expect(useWishlistStore.getState().items.map((item) => item.id)).toStrictEqual([2, 1])
  })

  it('Should report wishlist membership', () => {
    useWishlistStore.getState().toggleItem(mockItem)

    expect(useWishlistStore.getState().isInWishlist(1)).toBe(true)
    expect(useWishlistStore.getState().isInWishlist(2)).toBe(false)
  })
})
