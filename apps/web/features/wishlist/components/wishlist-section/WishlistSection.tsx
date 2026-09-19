'use client'

import { GamesList } from '@/features/games'

import { useWishlistStore } from '../../store/useWishlistStore'

export const WishlistSection = () => {
  const items = useWishlistStore((state) => state.items)

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

  return (
    <div data-testid='wishlist' className='w-full'>
      <h2 className='w-full pt-16 text-center font-display text-xl uppercase text-neon-magenta'>Wishlist</h2>
      <div className='w-full pt-10'>
        <GamesList gamesList={games} />
      </div>
    </div>
  )
}
