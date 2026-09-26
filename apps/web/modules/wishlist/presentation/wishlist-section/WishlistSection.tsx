'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui'

import { useAddCartItem } from '@/modules/cart/core/facade'
import { calculateDiscountedPrice } from '@/modules/games/domain/pricing'

import { useToggleWishlistItem, useWishlistItems } from '../../core/facade'
import { WishlistItem } from '../../domain/models'
import { PriceDropBadge } from '../price-drop-badge/PriceDropBadge'

// A list of rows, per the Figma "Account — Wishlist tab" frame.
const WishlistRow = ({ item }: { item: WishlistItem }) => {
  const addItem = useAddCartItem()
  const toggleWishlistItem = useToggleWishlistItem()

  const onAddToCart = () => {
    addItem({
      id: item.id,
      editionId: null,
      thumbnailUrl: item.thumbnailUrl,
      title: item.title,
      price: item.price,
      platform: item.platform,
      quantity: 1,
      discount: item.discount,
    })
  }

  return (
    <div
      data-testid='wishlist-row'
      className='flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-center'
    >
      <Link href={`/game/${item.id}`} className='flex min-w-0 flex-1 items-center gap-4'>
        <div className='relative size-11 shrink-0 overflow-hidden rounded bg-panel-alt'>
          <Image
            fill
            sizes='44px'
            style={{ objectFit: 'cover' }}
            alt={`${item.title} thumbnail`}
            src={item.thumbnailUrl}
          />
        </div>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <h3 className='truncate font-display text-[15px] font-medium text-foreground'>{item.title}</h3>
          <span className='font-sans text-xs text-muted-foreground'>{item.platform}</span>
        </div>
      </Link>
      <div className='flex flex-wrap items-center gap-4'>
        <PriceDropBadge gameId={item.id} snapshotDiscount={item.discount} />
        <span className='font-mono text-sm text-foreground'>
          €{calculateDiscountedPrice(item.price, item.discount)}
        </span>
        <Button data-testid='wishlist-add-to-cart' onClick={onAddToCart}>
          Add to Cart
        </Button>
        <button
          type='button'
          data-testid='wishlist-toggle'
          aria-label={`Remove ${item.title} from wishlist`}
          onClick={() => toggleWishlistItem(item)}
          className='font-sans text-xs font-semibold text-muted-foreground hover:text-foreground'
        >
          Remove
        </button>
      </div>
    </div>
  )
}

export const WishlistSection = () => {
  const items = useWishlistItems()
  const { push } = useRouter()

  return (
    <div data-testid='wishlist' className='w-full'>
      <h2 className='sr-only'>Wishlist</h2>
      {items.length === 0 ? (
        <div
          data-testid='wishlist-empty'
          className='flex flex-col items-center justify-center gap-4 rounded-md border border-ink bg-panel-alt px-0 py-12 text-foreground'
        >
          <p className='font-mono text-muted-foreground'>No games in your wishlist yet.</p>
          <Button onClick={() => push('/')}>Browse games</Button>
        </div>
      ) : (
        <div className='flex flex-col gap-px'>
          {items.map((item) => (
            <WishlistRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
