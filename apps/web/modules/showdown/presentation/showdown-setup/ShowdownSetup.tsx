'use client'

import { useEffect } from 'react'
import { Skeleton } from '@repo/ui'
import { Check } from 'lucide-react'

import { MAX_SHOWDOWN_GENRES, SHOWDOWN_SIZES } from '../../configuration/constraints'
import {
  useSetShowdownSize,
  useShowdownSetup,
  useShowdownStatus,
  useStartShowdown,
  useToggleShowdownGenre,
} from '../../core/facade'
import { fitSize, picksFor, sizeOptions } from '../../domain/bracket'
import { useGetGamesGenres } from '../../integration/repository'

const stepStyles = 'flex items-baseline gap-3'
const stepNumberStyles = 'font-mono text-sm text-primary'
const stepTitleStyles = 'font-display text-xl font-bold text-foreground'

export const ShowdownSetup = () => {
  const { data: genreCounts, isLoading, isError } = useGetGamesGenres()
  const { genres, size } = useShowdownSetup()
  const status = useShowdownStatus()
  const toggleGenre = useToggleShowdownGenre()
  const setSize = useSetShowdownSize()
  const start = useStartShowdown()

  // A game has one genre, so the "any of" pool is the sum of the chosen genres' counts.
  const poolSize = (genreCounts ?? [])
    .filter((entry) => genres.includes(entry.genre))
    .reduce((sum, entry) => sum + entry.count, 0)
  const isPoolTooSmall = genres.length > 0 && poolSize < SHOWDOWN_SIZES[0]

  useEffect(() => {
    if (genres.length > 0 && !isPoolTooSmall) setSize(fitSize(size, poolSize))
  }, [genres.length, isPoolTooSmall, poolSize, setSize, size])

  const canStart = genres.length > 0 && size <= poolSize && status !== 'loading'

  return (
    <div data-testid='showdown-setup' className='flex w-full flex-col gap-12'>
      <div className='flex flex-col gap-2'>
        <p className='font-mono text-xs uppercase tracking-wide text-primary'>Showdown</p>
        <h1 className='font-display text-3xl font-bold text-foreground sm:text-4xl'>
          Can&apos;t decide? Let the bracket choose.
        </h1>
        <p className='max-w-xl text-muted-foreground'>
          Pick your genres and a bracket size. You keep one game out of every two until one winner is left.
        </p>
      </div>

      <div className='flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16'>
        <div className='flex flex-1 flex-col gap-12'>
          <section className='flex flex-col gap-4'>
            <div className={stepStyles}>
              <span className={stepNumberStyles}>01</span>
              <h2 className={stepTitleStyles}>Pick up to {MAX_SHOWDOWN_GENRES} genres</h2>
              <span className='font-mono text-xs uppercase text-muted-foreground'>
                {genres.length} of {MAX_SHOWDOWN_GENRES} selected
              </span>
            </div>
            <p className='text-sm text-muted-foreground'>
              A game joins the pool if it matches any of the genres you pick.
            </p>
            {isLoading && <Skeleton className='h-24 w-full' />}
            {isError && <p className='text-sm text-destructive'>Could not load the genres. Please reload the page.</p>}
            <div className='flex flex-wrap gap-2.5'>
              {(genreCounts ?? []).map(({ genre, count }) => {
                const isSelected = genres.includes(genre)
                return (
                  <button
                    key={genre}
                    type='button'
                    data-testid='showdown-genre-chip'
                    aria-pressed={isSelected}
                    disabled={!isSelected && genres.length >= MAX_SHOWDOWN_GENRES}
                    onClick={() => toggleGenre(genre)}
                    className={`flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? 'border-primary bg-[color-mix(in_srgb,var(--primary)_15%,transparent)]'
                        : 'border-ink bg-panel-alt hover:border-muted-foreground'
                    }`}
                  >
                    {isSelected && <Check aria-hidden='true' className='h-3.5 w-3.5 text-primary' />}
                    {genre}
                    <span className={`font-mono text-xs ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
            {isPoolTooSmall && (
              <p data-testid='showdown-pool-warning' className='text-sm text-primary'>
                Not enough games in these genres. Add another genre.
              </p>
            )}
          </section>

          <section className='flex flex-col gap-4'>
            <div className={stepStyles}>
              <span className={stepNumberStyles}>02</span>
              <h2 className={stepTitleStyles}>Choose a bracket size</h2>
            </div>
            <div className='grid grid-cols-3 gap-3 sm:gap-4'>
              {sizeOptions(genres.length ? poolSize : Infinity).map((option) => {
                const isSelected = option.size === size
                const isEnabled = option.enabled && !isPoolTooSmall
                return (
                  <button
                    key={option.size}
                    type='button'
                    data-testid='showdown-size-option'
                    aria-pressed={isSelected}
                    disabled={!isEnabled}
                    onClick={() => setSize(option.size)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-50 sm:items-start sm:p-5 ${
                      isSelected && isEnabled
                        ? 'border-2 border-primary bg-[color-mix(in_srgb,var(--primary)_15%,transparent)]'
                        : 'border-ink bg-panel-alt'
                    }`}
                  >
                    <span className='flex items-baseline gap-2'>
                      <span className='font-display text-3xl font-bold text-foreground sm:text-4xl'>{option.size}</span>
                      <span className='hidden font-mono text-xs text-foreground sm:inline'>GAMES</span>
                    </span>
                    <span className={`font-mono text-xs ${isEnabled ? 'text-muted-foreground' : 'text-primary'}`}>
                      {isEnabled ? `${option.picks} picks` : `only ${poolSize} games`}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <aside className='sticky bottom-0 -mx-4 flex flex-col gap-4 border-t border-ink bg-panel-alt p-4 sm:mx-0 sm:rounded-lg sm:border lg:static lg:w-96 lg:p-7'>
          <p className='hidden font-mono text-xs uppercase tracking-wide text-primary lg:block'>Your bracket</p>
          <p className='font-display text-lg font-bold text-foreground lg:text-2xl'>
            {genres.length ? genres.join(' + ') : 'No genres yet'}
          </p>
          <dl className='hidden flex-col gap-3 text-sm lg:flex'>
            {[
              ['Games in pool', genres.length ? poolSize : '-'],
              ['Bracket size', size],
              ['Picks to make', picksFor(size)],
            ].map(([label, value]) => (
              <div key={label} className='flex justify-between'>
                <dt className='text-muted-foreground'>{label}</dt>
                <dd className='font-mono text-foreground'>{value}</dd>
              </div>
            ))}
          </dl>
          <button
            type='button'
            data-testid='showdown-start'
            disabled={!canStart}
            onClick={() => void start()}
            className='w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_90%,black)] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
          >
            {status === 'loading' ? 'Loading games...' : 'Start Showdown'}
          </button>
          <p className='hidden text-xs text-muted-foreground lg:block'>
            Top-rated games from your genres, paired at random.
          </p>
        </aside>
      </div>
    </div>
  )
}
