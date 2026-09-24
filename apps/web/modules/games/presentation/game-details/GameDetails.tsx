'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Skeleton, useToast } from '@repo/ui'

import { cn } from '@/lib/utils'
import { useRecordView } from '@/modules/account/core/facade'
import { useAddCartItem, useCartItems, useUpdateCartItemQuantity } from '@/modules/cart/core/facade'
import { CartItem } from '@/modules/cart/domain/models'
import { useIsInWishlist, useToggleWishlistItem } from '@/modules/wishlist/core/facade'

import { calculateDiscountedPrice } from '../../domain/pricing'
import { useGetGame } from '../../integration/repository'

const buttonStyles =
  'flex items-center gap-2 rounded-md border border-ink px-[30px] py-[15px] text-primary-foreground shadow-retro transition-transform duration-200 select-none touch-manipulation active:scale-95'

interface GameDetailsProps {
  gameId: number
}

export const GameDetails = ({ gameId }: GameDetailsProps) => {
  const recordView = useRecordView()
  useEffect(() => {
    recordView(gameId)
  }, [gameId, recordView])

  const items = useCartItems()
  const addItem = useAddCartItem()
  const updateItemQuantity = useUpdateCartItemQuantity()

  const isWishlisted = useIsInWishlist(gameId)
  const toggleWishlistItem = useToggleWishlistItem()

  const { toast } = useToast()

  const { data, isLoading } = useGetGame(gameId)

  const addGameHandler = (cartItem: CartItem) => {
    const gameInCart = items.find((item) => item.id === cartItem.id && item.editionId === cartItem.editionId)
    toast({ title: `${cartItem.editionName ?? data?.title} was added to your cart!` })
    if (gameInCart) {
      updateItemQuantity(gameInCart.id, gameInCart.editionId, gameInCart.quantity + 1)
    } else {
      addItem(cartItem)
    }
  }

  const wishlistToggleHandler = (wishlistItem: Parameters<typeof toggleWishlistItem>[0]) => {
    toast({
      title: isWishlisted
        ? `${wishlistItem.title} was removed from your wishlist`
        : `${wishlistItem.title} was added to your wishlist!`,
    })
    toggleWishlistItem(wishlistItem)
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[75vh] flex-col gap-16 px-40 py-12'>
        <div className='flex justify-between gap-12'>
          <Skeleton className='h-[300px] w-[500px] shrink-0' />
          <div className='flex w-[50vw] flex-col justify-between gap-6'>
            <div className='flex flex-col gap-4'>
              <Skeleton className='h-8 w-2/3' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </div>
            <div className='flex flex-col gap-4'>
              <Skeleton className='h-8 w-32 self-center' />
              <div className='flex gap-4'>
                <Skeleton className='h-[58px] w-[58px]' />
                <Skeleton className='h-[58px] w-full' />
              </div>
            </div>
          </div>
        </div>
        <Skeleton className='h-40 w-full' />
      </div>
    )
  }

  if (data && !isLoading) {
    const informationData = [
      { label: 'Genre', value: data.genre },
      { label: 'Platform', value: data.platform },
      { label: 'Publisher', value: data.publisher },
      { label: 'Developer', value: data.developer },
      { label: 'Release date', value: data.release_date },
    ]

    const cartItem = buildCartItem(data)
    const editions = data.editions ?? []

    return (
      <div className='flex min-h-[75vh] flex-col gap-16 px-40 py-12'>
        <div className='flex justify-between gap-12'>
          <div>
            <Image alt={data.title as string} width={500} height={300} src={data.thumbnail as string} />
          </div>
          <div className='flex w-[50vw] flex-col justify-between text-foreground'>
            <div>
              <h1 className='font-display text-2xl'>{data.title}</h1>

              <p className='m-0 mt-4 font-mono text-lg text-muted-foreground'>{data.short_description}</p>

              {editions.map((edition) => (
                <div key={edition.id} data-testid='edition-description' className='mt-3'>
                  <span className='font-mono text-sm font-bold text-neon-cyan'>{edition.name}: </span>
                  <span className='font-mono text-sm text-muted-foreground'>{edition.description}</span>
                </div>
              ))}
            </div>
            <div className='flex flex-col'>
              <div className='mb-4 mt-8 flex items-end justify-center gap-[0.6rem]'>
                {data.discount > 0 && (
                  <>
                    <span className='font-mono text-xl text-muted-foreground line-through'>{data.price}€</span>
                    <span className='font-mono text-xl text-neon-amber'>-{data.discount}%</span>
                  </>
                )}
                <span className='font-display text-3xl leading-[1.4] text-neon-magenta'>
                  {data.discount > 0 ? calculateDiscountedPrice(data.price, data.discount) : data.price}€
                </span>
              </div>
              <div className='flex flex-wrap gap-4'>
                <button
                  className={cn(buttonStyles, isWishlisted ? 'bg-neon-magenta' : 'bg-panel-alt')}
                  data-testid='wishlist-toggle'
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  onClick={() =>
                    wishlistToggleHandler({
                      id: data.id,
                      thumbnailUrl: data.thumbnail,
                      title: data.title,
                      price: data.price,
                      platform: data.platform,
                      rating: data.rating,
                      discount: data.discount,
                    })
                  }
                >
                  <Image width={24} height={24} alt='favorite' src='/icons/favorite.svg' />
                </button>
                <button
                  className={cn(buttonStyles, 'min-w-0 flex-1 justify-center bg-neon-magenta')}
                  data-testid='edition-option'
                  onClick={() => addGameHandler(cartItem)}
                >
                  <Image width={24} height={24} alt='shopping-cart' src='/icons/shopping-cart.svg' />{' '}
                  <span className='font-display text-xs'>Add Digital Copy</span>
                </button>
                {editions.map((edition) => {
                  const outOfStock = edition.stock <= 0
                  return (
                    <button
                      key={edition.id}
                      className={cn(
                        buttonStyles,
                        'min-w-0 flex-1 flex-col justify-center gap-0 bg-neon-magenta disabled:opacity-50',
                      )}
                      data-testid='edition-option'
                      disabled={outOfStock}
                      onClick={() => addGameHandler(buildEditionCartItem(data, edition))}
                    >
                      <span className='font-display text-xs'>{edition.name}</span>
                      <span data-testid='edition-stock' className='font-mono text-xs'>
                        {outOfStock ? 'Out of stock' : `${calculateDiscountedPrice(edition.price, edition.discount)}€`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div className='rounded-md border border-ink bg-panel-alt px-8 py-6'>
          {informationData.map((item) => (
            <div key={item.label} className='flex py-1'>
              <div className='mr-4 w-32'>
                <span className='font-mono text-base text-neon-cyan'>{item.label}: </span>
              </div>
              <div>
                <span className='font-mono text-base text-foreground'>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

function buildCartItem(data: {
  id: number
  thumbnail: string
  title: string
  price: number
  platform: string
  discount: number
}) {
  return {
    id: data.id,
    editionId: null,
    thumbnailUrl: data.thumbnail,
    title: data.title,
    price: data.price,
    platform: data.platform,
    discount: data.discount,
    quantity: 1,
  }
}

function buildEditionCartItem(
  data: { id: number; thumbnail: string; title: string; platform: string },
  edition: { id: number; name: string; price: number; discount: number },
) {
  return {
    id: data.id,
    editionId: edition.id,
    editionName: edition.name,
    thumbnailUrl: data.thumbnail,
    title: data.title,
    price: edition.price,
    platform: data.platform,
    discount: edition.discount,
    quantity: 1,
  }
}
