'use client'

import { useAddCartItem } from '@/modules/cart'
import { GamesList } from '@/modules/games'

import { useWishlistItems } from '../../core/facade'
import { PriceDropBadge } from '../price-drop-badge'

export const WishlistSection = () => {
  const items = useWishlistItems()
  const addItem = useAddCartItem()

  if (items.length === 0) {
    return null
  }

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
      <h2 className='w-full pt-16 text-center font-display text-xl uppercase text-neon-magenta'>Wishlist</h2>
      <div className='w-full pt-10'>
        <GamesList
          gamesList={games}
          onAddToCart={onAddToCart}
          renderExtra={(game) => <PriceDropBadge gameId={game.id as number} snapshotDiscount={game.discount ?? 0} />}
        />
      </div>
    </div>
  )
}
