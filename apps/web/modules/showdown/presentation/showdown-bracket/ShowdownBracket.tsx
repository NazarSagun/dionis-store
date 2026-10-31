'use client'

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'

import { PICK_TIMELINE, REDUCED_MOTION_PICK_MS } from '../../configuration/constraints'
import {
  useBackToShowdownSetup,
  usePickShowdownGame,
  useShowdownPicks,
  useShowdownProgress,
  useShowdownSetup,
  useUndoShowdownPick,
} from '../../core/facade'
import { progressLabel } from '../../domain/bracket'
import { Point, ShowdownGame } from '../../domain/models'
import { crackPath, seededRandom } from '../../domain/shatter'
import { MatchCard } from '../match-card/MatchCard'

import { Cracks, Shards } from './Shards'

type Phase = 'pick' | 'crack' | 'shatter' | 'fade'

interface PickAnimation {
  keep: ShowdownGame
  lose: ShowdownGame
  impact: Point
  phase: Phase
  // How far the kept card flies to reach its progress segment, in px.
  fly?: { x: number; y: number }
}

// A keyboard pick has no click point, so the cracks start at the center of the cover.
const COVER_CENTER: Point = { x: 50, y: 30 }

// Done picks are red, the current pick is white, the rest are dark.
const segmentColor = (index: number, done: number) => {
  if (index < done) return 'bg-primary'
  return index === done ? 'bg-foreground' : 'bg-secondary'
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export const ShowdownBracket = () => {
  const progress = useShowdownProgress()
  const picks = useShowdownPicks()
  const { genres, size } = useShowdownSetup()
  const pick = usePickShowdownGame()
  const undo = useUndoShowdownPick()
  const backToSetup = useBackToShowdownSetup()

  const [animation, setAnimation] = useState<PickAnimation | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const timers = useRef<number[]>([])
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const segmentRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const impact = animation?.impact
  const loserId = animation?.lose.id
  const cracks = useMemo(
    () => (impact && loserId !== undefined ? crackPath(impact, seededRandom(loserId)) : ''),
    [impact, loserId],
  )

  if (!progress.match) return null
  const match = progress.match
  const segmentCount = size - 1

  const later = (ms: number, step: () => void) => timers.current.push(window.setTimeout(step, ms))

  const onPick = (slot: 0 | 1, point: Point | null) => {
    if (isBusy) return
    const keep = match[slot]
    const lose = match[slot === 0 ? 1 : 0]
    const impact = point ?? COVER_CENTER
    setIsBusy(true)

    if (prefersReducedMotion()) {
      setAnimation({ keep, lose, impact, phase: 'fade' })
      later(REDUCED_MOTION_PICK_MS, () => {
        pick(keep.id)
        setAnimation(null)
        setIsBusy(false)
      })
      return
    }

    setAnimation({ keep, lose, impact, phase: 'pick' })
    later(PICK_TIMELINE.crack, () => setAnimation((current) => current && { ...current, phase: 'crack' }))
    later(PICK_TIMELINE.shatter, () => {
      const card = cardRefs.current[slot]?.getBoundingClientRect()
      const segment = segmentRefs.current[picks.length]?.getBoundingClientRect()
      const fly =
        card && segment
          ? {
              x: segment.left + segment.width / 2 - (card.left + card.width / 2),
              y: segment.top + segment.height / 2 - (card.top + card.height / 2),
            }
          : { x: 0, y: -200 }
      setAnimation((current) => current && { ...current, phase: 'shatter', fly })
    })
    later(PICK_TIMELINE.next, () => {
      pick(keep.id)
      setAnimation(null)
    })
    later(PICK_TIMELINE.done, () => setIsBusy(false))
  }

  const cardClass = (game: ShowdownGame, slot: number) => {
    if (!animation) {
      return `animate-showdown-enter motion-reduce:animate-none ${slot === 1 ? '[animation-delay:40ms]' : ''}`
    }
    const isKept = game.id === animation.keep.id
    if (animation.phase === 'fade') return isKept ? '' : 'opacity-0 transition-opacity duration-200'
    if (isKept) {
      return animation.phase === 'shatter'
        ? 'z-30'
        : 'z-30 scale-[1.03] rounded-lg shadow-[0_0_40px_color-mix(in_srgb,var(--primary)_30%,transparent)] ring-2 ring-primary transition-transform duration-[120ms] ease-out'
    }
    if (animation.phase === 'crack') return 'animate-showdown-shake opacity-85'
    if (animation.phase === 'shatter') return 'invisible'
    return ''
  }

  const cardStyle = (game: ShowdownGame): CSSProperties | undefined =>
    animation?.phase === 'shatter' && animation.fly && game.id === animation.keep.id
      ? {
          transform: `translate(${animation.fly.x}px, ${animation.fly.y}px) scale(0.15)`,
          opacity: 0,
          transition: 'transform 380ms ease-in, opacity 380ms ease-in',
        }
      : undefined

  const renderCard = (slot: 0 | 1) => {
    const game = match[slot]
    const isLoser = animation?.lose.id === game.id
    return (
      <div className='flex-1' style={cardStyle(game)}>
        <MatchCard
          ref={(element) => {
            cardRefs.current[slot] = element
          }}
          game={game}
          disabled={isBusy}
          onPick={(point) => onPick(slot, point)}
          className={cardClass(game, slot)}
        >
          {isLoser && animation?.phase === 'crack' && <Cracks path={cracks} />}
          {isLoser && animation?.phase === 'shatter' && (
            <div className='visible'>
              <Shards game={game} impact={animation.impact} />
            </div>
          )}
        </MatchCard>
      </div>
    )
  }

  return (
    <div data-testid='showdown-bracket' className='flex w-full flex-col gap-5 md:gap-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex flex-col gap-2'>
          <p className='font-mono text-xs uppercase tracking-wide text-primary'>
            Showdown · {genres.join(' + ')} · {size} games
          </p>
          <h1 className='font-display text-xl font-bold text-foreground sm:text-4xl'>
            Which one would you rather play?
          </h1>
        </div>
        <div className='flex gap-2'>
          <button
            type='button'
            data-testid='showdown-undo'
            disabled={picks.length === 0 || isBusy}
            onClick={undo}
            className='rounded-md border border-ink bg-panel-alt px-4 py-2.5 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
          >
            Undo
          </button>
          <button
            type='button'
            data-testid='showdown-restart'
            disabled={isBusy}
            onClick={backToSetup}
            className='rounded-md px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
          >
            Restart
          </button>
        </div>
      </div>

      <div data-testid='showdown-progress' className='flex flex-col gap-2.5'>
        <div className='flex justify-between font-mono text-xs uppercase sm:text-sm'>
          <span className='text-foreground'>{progressLabel(progress)}</span>
          <span className='text-muted-foreground'>
            {picks.length} of {segmentCount} picks
          </span>
        </div>
        <div className='flex gap-1' aria-hidden='true'>
          {Array.from({ length: segmentCount }, (_, index) => (
            <div
              key={index}
              ref={(element) => {
                segmentRefs.current[index] = element
              }}
              className={`h-1.5 flex-1 rounded-sm ${segmentColor(index, picks.length)} ${
                index === picks.length - 1 ? 'animate-showdown-pulse motion-reduce:animate-none' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div
        key={`${progress.roundIndex}-${progress.matchIndex}`}
        className='flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-6'
      >
        {renderCard(0)}
        <div
          aria-hidden='true'
          className='flex items-center justify-center gap-3 font-display text-sm font-bold text-muted-foreground md:h-16 md:w-16 md:shrink-0 md:rounded-full md:border-2 md:border-ink md:text-lg md:text-foreground'
        >
          VS
        </div>
        {renderCard(1)}
      </div>
      <p className='text-center text-sm text-muted-foreground'>
        <span className='md:hidden'>Tap a card to keep it.</span>
        <span className='hidden md:inline'>Click a card to keep it. The other game leaves the bracket.</span>
      </p>
    </div>
  )
}
