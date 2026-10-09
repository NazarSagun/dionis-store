import Image from 'next/image'
import Link from 'next/link'

import { formatAverageRating, formatReviewCount } from '@/modules/reviews/domain/models'
import { Stars } from '@/modules/reviews/presentation/stars/Stars'

import { calculateDiscountedPrice } from '../../domain/pricing'
import { GameDetailObject } from '../../integration/repository'
import { RatingBadge } from '../rating-badge/RatingBadge'

interface TopDealsProps {
  games: GameDetailObject[]
}

export const TopDeals = ({ games }: TopDealsProps) => {
  if (games.length === 0) {
    return null
  }

  const [featured, ...rest] = games
  const nextUp = rest.slice(0, 3)

  return (
    <div data-testid='top-deals' className='w-full'>
      <h2 className='w-full pt-16 text-center font-display text-xl uppercase text-neon-magenta'>Top Deals</h2>
      <div
        data-testid='marquee-slab'
        className='mt-10 flex w-full flex-col gap-8 rounded-lg bg-panel-alt p-6 shadow-retro md:flex-row'
      >
        <Link
          href={`/game/${featured.id}`}
          data-testid='featured-deal'
          className='flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center md:w-[560px] md:shrink-0'
        >
          <div className='relative aspect-square w-[140px] shrink-0 overflow-hidden rounded bg-ink sm:w-[220px]'>
            <Image
              fill
              priority
              sizes='220px'
              style={{ objectFit: 'cover' }}
              alt={`${featured.title} thumbnail`}
              src={featured.thumbnail}
            />
          </div>
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <span className='w-fit rounded bg-neon-amber px-2 py-1 font-mono text-xs text-ink'>Featured Deal</span>
            <h3 className='truncate font-mono text-2xl font-bold text-foreground'>{featured.title}</h3>
            <span className='font-mono text-xs text-muted-foreground'>{featured.platform}</span>
            <div className='flex items-center justify-between pt-1'>
              <div className='flex min-w-0 items-center gap-3'>
                <RatingBadge rating={featured.rating} />
                {featured.averageRating !== null && (
                  <span
                    data-testid='featured-reviews'
                    title={`Store rating: ${formatAverageRating(featured.averageRating)} from ${formatReviewCount(featured.reviewCount)}`}
                    className='flex items-center gap-1.5 font-mono text-xs text-muted-foreground'
                  >
                    <Stars
                      rating={featured.averageRating}
                      size={12}
                      className='hidden gap-0.5 sm:inline-flex'
                      data-testid='featured-stars'
                    />
                    <span data-testid='featured-average' className='text-foreground'>
                      {formatAverageRating(featured.averageRating)}
                    </span>
                    <span data-testid='featured-count'>({featured.reviewCount})</span>
                  </span>
                )}
              </div>
              {featured.discount ? (
                <span className='flex items-baseline gap-2'>
                  <span className='font-mono text-sm text-muted-foreground line-through'>€{featured.price}</span>
                  <span className='font-display text-[32px] text-neon-magenta'>
                    €{calculateDiscountedPrice(featured.price, featured.discount)}
                  </span>
                </span>
              ) : (
                <span className='font-display text-[32px] text-neon-magenta'>€{featured.price}</span>
              )}
            </div>
          </div>
        </Link>
        {nextUp.length > 0 && (
          <div className='flex min-w-0 flex-1 flex-col'>
            <span className='font-mono text-xs uppercase text-neon-cyan'>Next Up</span>
            {nextUp.map((game, index) => (
              <Link
                key={game.id}
                href={`/game/${game.id}`}
                data-testid='next-up-row'
                className='flex items-center gap-4 border-b border-ink py-2 last:border-b-0'
              >
                <span className='w-6 font-mono text-xs text-neon-cyan'>{String(index + 2).padStart(2, '0')}</span>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <span className='truncate font-mono text-sm text-foreground'>{game.title}</span>
                  <span className='truncate font-mono text-[11px] text-muted-foreground'>{game.platform}</span>
                </div>
                {game.discount ? (
                  <span className='flex shrink-0 items-baseline gap-1.5'>
                    <span className='font-mono text-[11px] text-muted-foreground line-through'>€{game.price}</span>
                    <span className='font-display text-sm text-neon-magenta'>
                      €{calculateDiscountedPrice(game.price, game.discount)}
                    </span>
                  </span>
                ) : (
                  <span className='shrink-0 font-display text-sm text-neon-magenta'>€{game.price}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
