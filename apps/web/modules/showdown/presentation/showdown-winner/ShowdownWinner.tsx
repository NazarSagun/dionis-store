'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'

import { useAddCartItem, useCartItems, useOpenCartDrawer } from '@/modules/cart/core/facade'
import { useIsInWishlist, useToggleWishlistItem } from '@/modules/wishlist/core/facade'

import { useBackToShowdownSetup, useShowdownProgress, useShowdownSetup } from '../../core/facade'
import { picksFor } from '../../domain/bracket'

const STAGES = ['Final', 'Semifinal', 'Semifinal']

const discounted = (price: number, discount: number) => ((price * (100 - discount)) / 100).toFixed(2)

export const ShowdownWinner = () => {
  const { winner, runnersUp } = useShowdownProgress()
  const { genres, size } = useShowdownSetup()
  const backToSetup = useBackToShowdownSetup()
  const cartItems = useCartItems()
  const addCartItem = useAddCartItem()
  const openCartDrawer = useOpenCartDrawer()
  const isWishlisted = useIsInWishlist(winner?.id)
  const toggleWishlistItem = useToggleWishlistItem()

  if (!winner) return null

  const isInCart = cartItems.some((item) => item.id === winner.id && item.editionId === null)

  const addToCart = () => {
    addCartItem({
      id: winner.id,
      editionId: null,
      thumbnailUrl: winner.thumbnail,
      title: winner.title,
      price: winner.price,
      platform: winner.platform,
      quantity: 1,
      discount: winner.discount,
    })
    openCartDrawer()
  }

  const toggleWishlist = () =>
    void toggleWishlistItem({
      id: winner.id,
      thumbnailUrl: winner.thumbnail,
      title: winner.title,
      price: winner.price,
      platform: winner.platform,
      rating: winner.rating,
      discount: winner.discount,
    })

  return (
    <div className='flex w-full flex-col gap-10'>
      <div className='flex flex-col gap-2'>
        <p className='font-mono text-xs uppercase tracking-wide text-primary'>
          Showdown · {genres.join(' + ')} · {picksFor(size)} picks done
        </p>
        <h1 className='font-display text-3xl font-bold text-foreground sm:text-4xl'>Your pick is in.</h1>
      </div>

      <section
        data-testid='showdown-winner'
        className='flex flex-col gap-6 rounded-xl border-2 border-primary bg-panel-alt p-4 shadow-[0_0_40px_color-mix(in_srgb,var(--primary)_20%,transparent)] sm:p-8 lg:flex-row lg:items-center lg:gap-14'
      >
        <div className='relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-secondary lg:w-[45%]'>
          <Image
            fill
            priority
            sizes='(min-width: 1024px) 45vw, 100vw'
            className='object-cover'
            alt=''
            src={winner.thumbnail}
          />
        </div>
        <div className='flex flex-col gap-4'>
          <span className='w-fit rounded bg-primary px-3 py-1 font-mono text-xs text-primary-foreground'>
            WINNER · 1 OF {size}
          </span>
          <h2 className='font-display text-3xl font-bold text-foreground sm:text-5xl'>{winner.title}</h2>
          <ul className='flex flex-wrap gap-1.5 font-mono text-xs'>
            <li className='rounded border border-ink px-2 py-0.5 text-foreground'>{winner.genre}</li>
            <li className='rounded border border-ink px-2 py-0.5 text-muted-foreground'>{winner.platform}</li>
            <li className='rounded border border-ink px-2 py-0.5 text-muted-foreground'>Rating {winner.rating}</li>
          </ul>
          <div className='flex items-center gap-3 font-mono'>
            {winner.discount > 0 && (
              <>
                <span className='rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground'>
                  -{winner.discount}%
                </span>
                <span className='text-muted-foreground line-through'>€{winner.price}</span>
              </>
            )}
            <span className='text-2xl text-foreground'>€{discounted(winner.price, winner.discount)}</span>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <button
              type='button'
              data-testid='showdown-winner-add-to-cart'
              disabled={isInCart}
              onClick={addToCart}
              className='w-full rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_90%,black)] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:w-auto'
            >
              {isInCart ? 'In cart' : 'Add to cart'}
            </button>
            <button
              type='button'
              data-testid='showdown-winner-wishlist'
              aria-pressed={isWishlisted}
              onClick={toggleWishlist}
              className='flex flex-1 items-center justify-center gap-2 rounded-md border border-ink bg-panel-alt px-5 py-3 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:flex-none'
            >
              <Heart aria-hidden='true' className={`h-4 w-4 ${isWishlisted ? 'fill-primary text-primary' : ''}`} />
              {isWishlisted ? 'In wishlist' : 'Add to wishlist'}
            </button>
            <Link
              href={`/game/${winner.id}`}
              className='flex-1 rounded-md px-5 py-3 text-center text-sm font-semibold text-muted-foreground hover:text-foreground sm:flex-none'
            >
              View game
            </Link>
          </div>
        </div>
      </section>

      <section className='flex flex-col gap-4'>
        <h2 className='font-display text-xl font-bold text-foreground'>Runners-up</h2>
        <ul className='grid gap-4 md:grid-cols-3'>
          {runnersUp.map((game, index) => (
            <li key={game.id}>
              <Link
                href={`/game/${game.id}`}
                data-testid='showdown-runner-up'
                className='flex items-center gap-4 rounded-lg border border-ink bg-panel-alt p-4 hover:border-muted-foreground'
              >
                <div className='relative h-16 w-24 shrink-0 overflow-hidden rounded bg-secondary'>
                  <Image fill sizes='96px' className='object-cover' alt='' src={game.thumbnail} />
                </div>
                <div className='flex min-w-0 flex-col gap-1'>
                  <span
                    className={`font-mono text-xs uppercase ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {STAGES[index]}
                  </span>
                  <span className='truncate font-display font-bold text-foreground'>{game.title}</span>
                  <span className='font-mono text-xs text-muted-foreground'>
                    {game.genre} · €{discounted(game.price, game.discount)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className='flex items-center gap-3'>
        <button
          type='button'
          data-testid='showdown-play-again'
          onClick={backToSetup}
          className='rounded-md border border-ink bg-panel-alt px-5 py-3 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring'
        >
          Play again
        </button>
        <span className='text-sm text-muted-foreground'>Same genres and size. New pairings.</span>
      </div>
    </div>
  )
}
