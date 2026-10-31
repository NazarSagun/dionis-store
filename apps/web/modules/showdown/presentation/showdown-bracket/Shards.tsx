import { useEffect, useMemo, useState } from 'react'

import { SHARD_COUNT } from '../../configuration/constraints'
import { Point, ShowdownGame } from '../../domain/models'
import { seededRandom, shatterCard } from '../../domain/shatter'
import { CardFace } from '../match-card/MatchCard'

// Copies of the card, each cut to one shard, that fly apart once they mount.
export const Shards = ({ game, impact }: { game: ShowdownGame; impact: Point }) => {
  const shards = useMemo(() => shatterCard(impact, SHARD_COUNT, seededRandom(game.id)), [game.id, impact])
  const [isFlying, setIsFlying] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsFlying(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div data-testid='showdown-shards' aria-hidden='true' className='pointer-events-none absolute inset-0 z-20'>
      {shards.map((shard) => (
        <div
          key={shard.clipPath}
          className='absolute inset-0 transition-[transform,opacity] duration-[380ms] ease-in'
          style={{
            clipPath: shard.clipPath,
            transform: isFlying
              ? `translate(${shard.dx}px, ${shard.dy}px) rotate(${shard.rotate}deg)`
              : 'translate(0, 0) rotate(0deg)',
            opacity: isFlying ? 0 : 1,
          }}
        >
          <CardFace game={game} />
        </div>
      ))}
    </div>
  )
}

export const Cracks = ({ path }: { path: string }) => (
  <svg
    data-testid='showdown-cracks'
    aria-hidden='true'
    viewBox='0 0 100 100'
    preserveAspectRatio='none'
    className='pointer-events-none absolute inset-0 z-20 h-full w-full text-foreground'
  >
    <path
      d={path}
      fill='none'
      stroke='currentColor'
      strokeOpacity={0.8}
      strokeWidth={1.5}
      vectorEffect='non-scaling-stroke'
    />
  </svg>
)
