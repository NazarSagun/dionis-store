import { MouseEvent, useState } from 'react'
import Image from 'next/image'
import { GameObject } from '@repo/dionis-api/src/model'

import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore'

import { calculateDiscountedPrice } from '../../helpers'

export type GameCardProps = Pick<GameObject, 'title' | 'rating' | 'price' | 'platform'> & {
  id?: number
  onClick?: () => void
  imageSrc: string
  discount?: number
}

export const GameCard = ({ id, title, rating, price, onClick, platform, imageSrc, discount }: GameCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const isWishlisted = useWishlistStore((state) => (id !== undefined ? state.isInWishlist(id) : false))
  const toggleWishlistItem = useWishlistStore((state) => state.toggleItem)

  const onClickHandler = () => {
    onClick && onClick()
  }

  const onWishlistToggle = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (id === undefined) return
    toggleWishlistItem({ id, thumbnailUrl: imageSrc, title, price, platform, rating, discount: discount ?? 0 })
  }

  return (
    <div
      className='flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-ink bg-panel-alt text-foreground shadow-retro transition-transform duration-500 hover:-translate-y-[5px]'
      onClick={onClickHandler}
      data-testid='card'
    >
      <div className='relative aspect-[4/3] w-full shrink-0'>
        <Image
          onLoad={() => setIsImageLoaded(true)}
          priority={true}
          fill
          sizes='(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw'
          style={{ objectFit: 'cover' }}
          alt={`${title} thumbnail`}
          src={imageSrc}
          data-testid='image'
        />
        {!isImageLoaded && (
          <div className='absolute inset-0 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-[#313131] from-25% via-[#5a5a5a] via-50% to-[#303030] to-75%' />
        )}
        {!!discount && (
          <span
            data-testid='discount-badge'
            className='absolute left-2 top-2 rounded border-2 border-ink bg-neon-amber px-1.5 py-0.5 font-mono text-xs font-bold text-ink'
          >
            -{discount}%
          </span>
        )}
        {id !== undefined && (
          <button
            type='button'
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            data-testid='wishlist-toggle'
            onClick={onWishlistToggle}
            className={`absolute right-2 top-2 flex items-center justify-center rounded-full border-2 border-ink p-1 shadow-retro ${
              isWishlisted ? 'bg-neon-magenta' : 'bg-panel-alt'
            }`}
          >
            <Image width={18} height={18} alt='favorite' src='/icons/favorite.svg' />
          </button>
        )}
      </div>
      <div className='flex min-w-0 flex-col gap-2 p-4'>
        <h3 className='w-full truncate font-mono text-lg font-bold'>{title}</h3>
        <span className='font-mono text-sm text-muted-foreground'>{platform}</span>
        <div className='flex items-center justify-between pt-1'>
          <span className='rounded border-2 border-ink bg-neon-green p-[3px] font-mono text-sm font-bold text-ink'>
            {rating}
          </span>
          {discount ? (
            <span className='flex items-baseline gap-1.5'>
              <span className='font-mono text-xs text-muted-foreground line-through'>€{price}</span>
              <span className='font-display text-lg text-neon-magenta'>
                €{calculateDiscountedPrice(price, discount)}
              </span>
            </span>
          ) : (
            <span className='font-display text-lg text-neon-magenta'>€{price}</span>
          )}
        </div>
      </div>
    </div>
  )
}
