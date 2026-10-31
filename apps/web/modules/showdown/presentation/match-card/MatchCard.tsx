import { forwardRef, MouseEvent, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { Point, ShowdownGame } from '../../domain/models'

const tagStyles = 'rounded border border-ink px-2 py-0.5 font-mono text-xs text-muted-foreground'

const detailsStyles = 'text-xs font-semibold text-muted-foreground md:text-sm'

// The look of a match card: a compact row on a phone, so both cards fit one screen, and a tall card from md up.
// The shatter effect cuts copies of it with `interactive` off, so no copy holds a link.
export const CardFace = ({ game, interactive = false }: { game: ShowdownGame; interactive?: boolean }) => (
  <div className='flex h-full flex-row overflow-hidden rounded-lg border border-ink bg-panel-alt md:flex-col'>
    <div className='relative min-h-28 w-28 shrink-0 bg-secondary md:aspect-[16/8] md:min-h-0 md:w-full'>
      <Image fill sizes='(min-width: 768px) 45vw, 112px' className='object-cover' alt='' src={game.thumbnail} />
    </div>
    <div className='flex min-w-0 flex-1 flex-col gap-2 p-3 md:gap-3 md:p-6'>
      <ul className='flex flex-wrap gap-1.5'>
        <li className={`${tagStyles} text-foreground`}>{game.genre}</li>
        <li className={`hidden md:block ${tagStyles}`}>{game.platform}</li>
        <li className={tagStyles}>Rating {game.rating}</li>
      </ul>
      <h3 className='line-clamp-2 font-display text-base font-bold text-foreground md:text-2xl'>{game.title}</h3>
      <div className='mt-auto flex items-center justify-between md:pt-1'>
        {interactive ? (
          <Link
            href={`/game/${game.id}`}
            target='_blank'
            data-testid='showdown-match-details'
            className={`relative z-10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${detailsStyles}`}
          >
            Details ↗
          </Link>
        ) : (
          <span className={detailsStyles}>Details ↗</span>
        )}
        <span
          aria-hidden='true'
          className='hidden rounded-md border border-ink px-4 py-2 text-sm font-semibold md:inline text-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground'
        >
          Keep this one
        </span>
      </div>
    </div>
  </div>
)

interface MatchCardProps {
  game: ShowdownGame
  disabled: boolean
  // Where the user clicked, in percent of the card. A keyboard pick has no point.
  onPick: (impact: Point | null) => void
  className?: string
  children?: ReactNode
}

// A whole-card button picks the game. The Details link sits above it, so a click on it never picks.
export const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(
  ({ game, disabled, onPick, className = '', children }, ref) => {
    const onClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0) return onPick(null)
      const rect = event.currentTarget.getBoundingClientRect()
      onPick({
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      })
    }

    return (
      <div ref={ref} data-testid='showdown-match-card' className={`group relative ${className}`}>
        <CardFace game={game} interactive />
        <button
          type='button'
          aria-label={`Keep ${game.title}`}
          disabled={disabled}
          onClick={onClick}
          className='absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default'
        />
        {children}
      </div>
    )
  },
)
MatchCard.displayName = 'MatchCard'
