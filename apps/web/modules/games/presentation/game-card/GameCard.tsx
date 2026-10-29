import { KeyboardEvent, MouseEvent, ReactNode, useState } from 'react'
import Image from 'next/image'

import { useIsInWishlist, useToggleWishlistItem } from '@/modules/wishlist/core/facade'

import { platformLabels } from '../../domain/platforms'
import { calculateDiscountedPrice } from '../../domain/pricing'
import { GameObject } from '../../integration/repository'

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
    onClick?.()
  }

  const onKeyDownHandler = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClickHandler()
    }
  }

  const onWishlistToggle = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (id === undefined) return
    void toggleWishlistItem({ id, thumbnailUrl: imageSrc, title, price, platform, rating, discount: discount ?? 0 })
  }

  const onAddToCartClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onAddToCart?.()
  }

  return (
    <div
      className='group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-md border border-ink bg-panel-alt text-foreground transition-transform duration-300 hover:-translate-y-[5px]'
      role='link'
      tabIndex={0}
      onClick={onClickHandler}
      onKeyDown={onKeyDownHandler}
      data-testid='card'
    >
      <div className='relative aspect-video w-full shrink-0 overflow-hidden'>
        <Image
          onLoad={() => setIsImageLoaded(true)}
          priority
          fill
          sizes='(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
          className='object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100'
          alt={`${title} thumbnail`}
          src={imageSrc}
          data-testid='image'
        />
        {!isImageLoaded && (
          <div className='absolute inset-0 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted from-25% via-border via-50% to-muted to-75%' />
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
      <div className='flex min-w-0 flex-1 flex-col gap-3 p-5'>
        <h3 className='w-full truncate font-display text-lg font-medium'>{title}</h3>
        <ul aria-label={platform} className='flex flex-wrap gap-1.5'>
          {platformLabels(platform).map((label) => (
            <li
              key={label}
              aria-hidden='true'
              className='rounded border border-ink px-2 py-0.5 font-mono text-xs text-muted-foreground'
            >
              {label}
            </li>
          ))}
        </ul>
        {extraBadge}
        <div className='mt-auto flex items-center gap-2 pt-1'>
          {discount ? (
            <>
              <span className='font-mono text-sm text-muted-foreground line-through'>€{price}</span>
              <span className='font-mono text-lg text-foreground'>€{calculateDiscountedPrice(price, discount)}</span>
            </>
          ) : (
            <span className='font-mono text-lg text-foreground'>€{price}</span>
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
