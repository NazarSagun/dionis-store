'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Skeleton, useToast } from '@repo/ui'

import { cn } from '@/lib/utils'
import { useRecordView } from '@/modules/account/core/facade'
import { useIsAuthenticated } from '@/modules/auth/core/facade'
import { useAddCartItem, useCartItems, useUpdateCartItemQuantity } from '@/modules/cart/core/facade'
import { CartItem } from '@/modules/cart/domain/models'
import { ReviewsSection } from '@/modules/reviews/presentation/reviews-section/ReviewsSection'
import { useIsInWishlist, useToggleWishlistItem } from '@/modules/wishlist/core/facade'

import { isGameOwned } from '../../domain/ownership'
import { calculateDiscountedPrice } from '../../domain/pricing'
import { useGetGame, useGetOwnedItems } from '../../integration/repository'
import { EditionNotify } from '../edition-notify/EditionNotify'
import { ExternalScores } from '../external-scores/ExternalScores'
import { GameGallery } from '../game-gallery/GameGallery'
import { GameLanguages } from '../game-languages/GameLanguages'
import { GameSections } from '../game-sections/GameSections'
import { GameRecommendations } from '../recommendations/GameRecommendations'

// Sizes from the "format-picker" in the Figma frame "Game Details":
// a label line and a price line, 12px by 16px padding, 15px semibold text.
const optionStyles =
  'flex flex-col items-start justify-center whitespace-nowrap rounded-md border px-4 py-3 text-left font-sans text-[15px] font-semibold leading-snug transition-transform duration-200 select-none touch-manipulation active:scale-95 disabled:active:scale-100'
const buyStyles = 'border-transparent bg-neon-magenta text-primary-foreground hover:brightness-110'
const ownedStyles = 'border-ink bg-panel-alt text-foreground'

interface GameDetailsProps {
  gameId: number
}

const editionStockLabel = (isOwned: boolean, outOfStock: boolean, price: string) => {
  if (isOwned) return 'Already in Library'
  if (outOfStock) return 'Out of stock'
  return price
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
  const isAuthenticated = useIsAuthenticated()
  // A guest owns nothing, so skip the request instead of letting it 401.
  const { data: owned } = useGetOwnedItems({ query: { enabled: isAuthenticated } })

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
    void toggleWishlistItem(wishlistItem)
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[75vh] flex-col gap-16 px-4 py-12 sm:px-8 lg:px-40'>
        <div className='flex flex-col gap-12 lg:flex-row lg:justify-between'>
          <div className='flex w-full max-w-[500px] shrink-0 flex-col gap-3'>
            <Skeleton className='aspect-video w-full' />
            <Skeleton className='h-[120px] w-full' />
          </div>
          <div className='flex w-full flex-col justify-between gap-6 lg:w-[50vw]'>
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
    const isDigitalOwned = isGameOwned(owned, data.id, null)

    return (
      <div className='flex min-h-[75vh] flex-col gap-16 px-4 py-12 sm:px-8 lg:px-40'>
        <div className='flex flex-col gap-12 lg:flex-row'>
          <GameGallery
            title={data.title}
            thumbnail={data.thumbnail}
            images={data.images ?? []}
            trailerYoutubeId={data.trailerYoutubeId}
          />
          <div className='flex w-full min-w-0 flex-1 flex-col justify-between text-foreground'>
            <div>
              <div className='flex items-start gap-4'>
                {data.coverUrl && (
                  <Image
                    data-testid='game-cover'
                    src={data.coverUrl}
                    alt={`${data.title} cover`}
                    width={72}
                    height={96}
                    className='h-24 w-[72px] shrink-0 rounded border border-ink object-cover'
                  />
                )}
                <div className='flex flex-col gap-2'>
                  <h1 className='font-display text-2xl'>{data.title}</h1>
                  {(data.ageRatings ?? []).length > 0 && (
                    <ul className='flex flex-wrap gap-2'>
                      {(data.ageRatings ?? []).map((label) => (
                        <li
                          key={label}
                          data-testid='age-rating'
                          className='rounded border border-ink px-2 py-0.5 font-mono text-xs text-muted-foreground'
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <p className='m-0 mt-4 font-mono text-lg text-muted-foreground'>{data.short_description}</p>

              {editions.map((edition) => (
                <div key={edition.id} data-testid='edition-description' className='mt-3'>
                  <span className='font-mono text-sm font-bold text-neon-cyan'>{edition.name}: </span>
                  <span className='font-mono text-sm text-muted-foreground'>{edition.description}</span>
                </div>
              ))}
            </div>
            <div className='mt-8 flex flex-col gap-4'>
              <div className='flex items-center gap-6'>
                <div className='flex items-end gap-[0.6rem]'>
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
                <button
                  type='button'
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-ink transition-colors',
                    isWishlisted ? 'bg-neon-magenta' : 'bg-panel-alt hover:bg-background',
                  )}
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
                  <Image width={22} height={22} alt='' src='/icons/favorite.svg' />
                </button>
              </div>
              <span className='font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                Choose a format
              </span>
              {/* Equal columns at least as wide as the longest label, so every label fits on one line. */}
              <div className='grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] items-start gap-2.5'>
                <button
                  type='button'
                  className={cn(optionStyles, isDigitalOwned ? ownedStyles : buyStyles)}
                  data-testid='edition-option'
                  disabled={isDigitalOwned}
                  onClick={() => addGameHandler(cartItem)}
                >
                  <span>Add Digital Copy</span>
                  <span>
                    {isDigitalOwned
                      ? 'Already in Library'
                      : `${data.discount > 0 ? calculateDiscountedPrice(data.price, data.discount) : data.price}€`}
                  </span>
                </button>
                {editions.map((edition) => {
                  const outOfStock = edition.stock <= 0
                  const isOwned = isGameOwned(owned, data.id, edition.id)
                  // A sold-out edition is a tile in the same slot as the buy buttons, with the alert inside it.
                  if (outOfStock && !isOwned) {
                    return (
                      <div
                        key={edition.id}
                        data-testid='edition-option'
                        role='group'
                        aria-label={`${edition.name}, out of stock`}
                        className='flex flex-col items-center justify-center gap-2 rounded-md border border-ink bg-panel-alt px-3 py-2.5 text-center text-foreground'
                      >
                        <div className='flex flex-col items-center'>
                          <span className='whitespace-nowrap font-sans text-sm font-semibold'>{edition.name}</span>
                          <span data-testid='edition-stock' className='font-mono text-xs text-muted-foreground'>
                            {editionStockLabel(false, true, '')}
                          </span>
                        </div>
                        <EditionNotify gameId={data.id} editionId={edition.id} />
                      </div>
                    )
                  }
                  return (
                    <button
                      type='button'
                      key={edition.id}
                      className={cn(optionStyles, isOwned ? ownedStyles : buyStyles)}
                      data-testid='edition-option'
                      disabled={outOfStock || isOwned}
                      onClick={() => addGameHandler(buildEditionCartItem(data, edition))}
                    >
                      <span>{edition.name}</span>
                      <span data-testid='edition-stock'>
                        {editionStockLabel(
                          isOwned,
                          outOfStock,
                          `${calculateDiscountedPrice(edition.price, edition.discount)}€`,
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <GameSections sections={data.sections ?? []} />
        <GameLanguages languages={data.languages ?? []} />
        <div className='rounded-md border border-ink bg-panel-alt px-8 py-6'>
          {informationData.map((item) => (
            <div key={item.label} className='flex flex-wrap py-1'>
              <div className='mr-4 w-28 shrink-0 sm:w-32'>
                <span className='font-mono text-base text-neon-cyan'>{item.label}: </span>
              </div>
              <div>
                <span className='font-mono text-base text-foreground'>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
        <ExternalScores
          criticRating={data.criticRating ?? null}
          criticRatingCount={data.criticRatingCount ?? null}
          userRating={data.userRating ?? null}
          userRatingCount={data.userRatingCount ?? null}
        />
        <GameRecommendations key={data.id} gameId={data.id} />
        <ReviewsSection gameId={data.id} averageRating={data.averageRating} reviewCount={data.reviewCount} />
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
