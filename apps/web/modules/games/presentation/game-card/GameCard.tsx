import { MouseEvent, ReactNode, useState } from 'react'
import Image from 'next/image'
import { GameObject } from '@repo/dionis-api/src/model'

import { useIsInWishlist, useToggleWishlistItem } from '@/modules/wishlist/core/facade'

import { calculateDiscountedPrice } from '../../domain/pricing'

export type GameCardProps = Pick<GameObject, 'title' | 'rating' | 'price' | 'platform'> & {
  id?: number
  onClick?: () => void
  imageSrc: string
  discount?: number
  onAddToCart?: () => void
  extraBadge?: ReactNode
}

export const GameCard = ({
  id,
  title,
  rating,
  price,
  onClick,
  platform,
  imageSrc,
  discount,
  onAddToCart,
  extraBadge,
}: GameCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const isWishlisted = useIsInWishlist(id)
  const toggleWishlistItem = useToggleWishlistItem()

  const onClickHandler = () => {
    onClick && onClick()
  }

  const onWishlistToggle = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (id === undefined) return
    toggleWishlistItem({ id, thumbnailUrl: imageSrc, title, price, platform, rating, discount: discount ?? 0 })
  }

  const onAddToCartClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onAddToCart?.()
  }

  return (
    <div
      className='flex w-full cursor-pointer flex-col overflow-hidden rounded-md border border-ink bg-panel-alt text-foreground transition-transform duration-500 hover:-translate-y-[5px]'
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
            className='absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground'
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
            className={`absolute right-2 top-2 flex items-center justify-center rounded-full border border-ink p-1 ${
              isWishlisted ? 'bg-primary' : 'bg-panel-alt'
            }`}
          >
            <Image width={18} height={18} alt='favorite' src='/icons/favorite.svg' />
          </button>
        )}
      </div>
      <div className='flex min-w-0 flex-col gap-2 p-4'>
        <h3 className='w-full truncate font-display text-base font-medium'>{title}</h3>
        <span className='text-sm text-muted-foreground'>{platform}</span>
        {extraBadge}
        <div className='flex items-center gap-1.5 pt-1'>
          {discount ? (
            <>
              <span className='font-mono text-xs text-muted-foreground line-through'>€{price}</span>
              <span className='font-mono text-base text-foreground'>€{calculateDiscountedPrice(price, discount)}</span>
            </>
          ) : (
            <span className='font-mono text-base text-foreground'>€{price}</span>
          )}
        </div>
        {onAddToCart && (
          <button
            type='button'
            data-testid='wishlist-add-to-cart'
            onClick={onAddToCartClick}
            className='w-full rounded-md border border-ink bg-secondary px-3 py-2 font-mono text-xs font-bold text-foreground'
          >
            Add to cart
          </button>
        )}
      </div>
    </div>
  )
}
