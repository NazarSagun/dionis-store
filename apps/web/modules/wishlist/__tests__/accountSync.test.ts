import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { serviceWorker } from '@/test-utils/mock-server'

import { clearWishlist, mergeGuestWishlist, toggleWishlistItem } from '../core/actions/accountSync'
import { useWishlistStore } from '../core/store'

const game = {
  id: 1,
  thumbnailUrl: 'thumb.jpg',
  title: 'Dauntless',
  price: 47,
  platform: 'PC',
  rating: '4.5',
  discount: 10,
}

const serverItem = (id: number, discountSnapshot: number) => ({
  gameId: id,
  discountSnapshot,
  createdAt: '2026-09-26T10:00:00.000Z',
  game: { id, title: `Game ${id}`, thumbnail: `${id}.jpg`, price: 20, platform: 'PC', rating: '4.0', discount: 30 },
})

describe('wishlist account sync', () => {
  let requests: string[]

  beforeEach(() => {
    useWishlistStore.setState({ items: [] })
    requests = []
    serviceWorker.events.on('request:start', ({ request }) => {
      requests.push(`${request.method} ${new URL(request.url).pathname}`)
    })
  })

  afterEach(() => {
    serviceWorker.events.removeAllListeners()
  })

  it('keeps a guest toggle local and calls no API', async () => {
    await toggleWishlistItem(game, false)

    expect(useWishlistStore.getState().items.map((item) => item.id)).toEqual([1])
    expect(requests).toEqual([])
  })

  it('adds for a signed-in player and replaces the store with the server list', async () => {
    serviceWorker.use(http.put('*/wishlist/1', () => HttpResponse.json([serverItem(1, 10)])))

    await toggleWishlistItem(game, true)

    expect(requests).toEqual(['PUT /api/wishlist/1'])
    expect(useWishlistStore.getState().items).toEqual([
      expect.objectContaining({
        id: 1,
        title: 'Game 1',
        discount: 10,
        addedAt: Date.parse('2026-09-26T10:00:00.000Z'),
      }),
    ])
  })

  it('removes a game that is already on the list', async () => {
    useWishlistStore.setState({ items: [{ ...game, addedAt: 1 }] })
    serviceWorker.use(http.delete('*/wishlist/1', () => HttpResponse.json([])))

    await toggleWishlistItem(game, true)

    expect(requests).toEqual(['DELETE /api/wishlist/1'])
    expect(useWishlistStore.getState().items).toEqual([])
  })

  it('undoes the change and rethrows when the server call fails', async () => {
    serviceWorker.use(http.put('*/wishlist/1', () => HttpResponse.json({ message: 'down' }, { status: 500 })))

    await expect(toggleWishlistItem(game, true)).rejects.toBeTruthy()

    expect(useWishlistStore.getState().items).toEqual([])
  })

  it('merges the guest items on login, sending their snapshots and dates', async () => {
    useWishlistStore.setState({ items: [{ ...game, addedAt: 1_700_000_000_000 }] })
    let body: unknown
    serviceWorker.use(
      http.post('*/wishlist/merge', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json([serverItem(2, 0), serverItem(1, 10)])
      }),
    )

    await mergeGuestWishlist()

    expect(body).toEqual({ items: [{ gameId: 1, discount: 10, addedAt: 1_700_000_000_000 }] })
    expect(useWishlistStore.getState().items.map((item) => item.id)).toEqual([2, 1])
  })

  it('loads the account list instead of merging when the guest list is empty', async () => {
    serviceWorker.use(http.get('*/wishlist', () => HttpResponse.json([serverItem(3, 0)])))

    await mergeGuestWishlist()

    expect(requests).toEqual(['GET /api/wishlist'])
    expect(useWishlistStore.getState().items.map((item) => item.id)).toEqual([3])
  })

  it('clears the local list on logout', () => {
    useWishlistStore.setState({ items: [{ ...game, addedAt: 1 }] })

    clearWishlist()

    expect(useWishlistStore.getState().items).toEqual([])
  })
})
