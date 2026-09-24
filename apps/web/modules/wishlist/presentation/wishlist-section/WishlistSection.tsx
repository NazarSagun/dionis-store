'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'

import { useAddCartItem } from '@/modules/cart/core/facade'
import { GamesList } from '@/modules/games/presentation/games-list/GamesList'

import { useWishlistItems } from '../../core/facade'
import { PriceDropBadge } from '../price-drop-badge/PriceDropBadge'

export const WishlistSection = () => {
  const items = useWishlistItems()
  const addItem = useAddCartItem()
  const { push } = useRouter()

  const games = items.map((item) => ({
    id: item.id,
    title: item.title,
    price: item.price,
    rating: item.rating,
    platform: item.platform,
    thumbnail: item.thumbnailUrl,
    discount: item.discount,
  }))

  const onAddToCart = (game: (typeof games)[number]) => {
    addItem({
      id: game.id,
      editionId: null,
      thumbnailUrl: game.thumbnail,
      title: game.title,
      price: game.price,
      platform: game.platform,
      quantity: 1,
      discount: game.discount,
    })
  }

  return (
    <div data-testid='wishlist' className='w-full'>
      <h2 className='w-full pt-16 font-display text-2xl font-bold text-foreground'>Wishlist</h2>
      <div className='w-full pt-10'>
        {items.length === 0 ? (
          <div
            data-testid='wishlist-empty'
            className='flex flex-col items-center justify-center gap-4 rounded-md border border-ink bg-panel-alt px-0 py-12 text-foreground'
          >
            <p className='font-mono text-muted-foreground'>No games in your wishlist yet.</p>
            <Button onClick={() => push('/')}>Browse games</Button>
          </div>
        ) : (
          <GamesList
            gamesList={games}
            onAddToCart={onAddToCart}
            renderExtra={(game) => <PriceDropBadge gameId={game.id as number} snapshotDiscount={game.discount ?? 0} />}
          />
        )}
      </div>
    </div>
  )
}
