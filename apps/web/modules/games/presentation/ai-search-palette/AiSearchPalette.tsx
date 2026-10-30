'use client'

import { KeyboardEvent, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
  AI_SEARCH_EXAMPLES,
  AiFilterChip,
  aiFilterChips,
  aiTransitionName,
  MAX_AI_QUERY_LENGTH,
  toGamesFilters,
} from '../../domain/ai-search'
import { toQueryString } from '../../domain/filters'
import { getGetGamesQueryOptions, usePostGamesAiSearch } from '../../integration/repository'

import { landFilters } from './landing'

// The palette of the AI search spec (Feature 2): one request, its filters as
// chips, then the chips fly into the home page toolbar (landing.ts).

const RESULT_HOLD_MS = 600
const CHIP_STAGGER_MS = 60

type PaletteState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'rejected' }
  | { kind: 'error' }
  | { kind: 'result'; chips: AiFilterChip[]; fallback: boolean; totalGames?: number }

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const rowStyles = 'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm'

export const AiSearchPalette = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  // True while the chips fly. The palette leaves the DOM at once, so no chip
  // shares a transition name with the toolbar control it lands on.
  const [landing, setLanding] = useState(false)
  const [query, setQuery] = useState('')
  const [activeExample, setActiveExample] = useState(-1)
  const [state, setState] = useState<PaletteState>({ kind: 'idle' })
  const { mutateAsync: askAi } = usePostGamesAiSearch()

  const pending = state.kind === 'pending' || state.kind === 'result'
  const canSubmit = query.trim().length > 0 && !pending

  const openPalette = () => {
    setQuery('')
    setActiveExample(-1)
    setState({ kind: 'idle' })
    setOpen(true)
  }

  const submit = async () => {
    if (!canSubmit) return
    setState({ kind: 'pending' })
    let result
    try {
      result = await askAi({ data: { query: query.trim() } })
    } catch {
      setState({ kind: 'error' })
      return
    }
    if (result.status === 'rejected') {
      setState({ kind: 'rejected' })
      return
    }

    const filters = toGamesFilters(result.filters)
    const chips = aiFilterChips(result.filters)
    setState({ kind: 'result', chips, fallback: result.status === 'fallback' })

    // Load the new games while the chips show, so the grid swaps without a skeleton.
    const { page, ...params } = filters
    const [games] = await Promise.all([
      queryClient.fetchQuery(getGetGamesQueryOptions(page, params)).catch(() => undefined),
      delay(RESULT_HOLD_MS),
    ])
    setState({ kind: 'result', chips, fallback: result.status === 'fallback', totalGames: games?.totalGames })
    await delay(CHIP_STAGGER_MS * 2)

    const url = `/${toQueryString(filters)}`
    await landFilters({
      url,
      keys: chips.map((chip) => chip.key),
      navigate: () => {
        flushSync(() => {
          setLanding(true)
          setOpen(false)
        })
        router.push(url, { scroll: false })
      },
    })
    setLanding(false)
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveExample((index) => (index + step + AI_SEARCH_EXAMPLES.length) % AI_SEARCH_EXAMPLES.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (activeExample >= 0) {
        setQuery(AI_SEARCH_EXAMPLES[activeExample].text)
        setActiveExample(-1)
      } else {
        void submit()
      }
    }
  }

  const fillExample = (text: string) => {
    setQuery(text)
    setActiveExample(-1)
    setState({ kind: 'idle' })
  }

  return (
    <>
      <button
        type='button'
        data-testid='ai-search-open'
        onClick={openPalette}
        className='flex items-center gap-1.5 rounded-md border border-primary px-3 py-1.5 font-mono text-sm text-foreground hover:bg-primary/10'
      >
        <span className='text-primary'>✦</span>
        Ask AI
      </button>
      {!landing && (
        <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
          <DialogPortal>
            <DialogOverlay className='bg-background/70' />
            <DialogPrimitive.Content
              data-testid='ai-search-dialog'
              aria-describedby={undefined}
              className='fixed left-1/2 top-4 z-50 w-[calc(100%-32px)] max-w-[680px] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 sm:top-[120px]'
            >
              <DialogTitle className='sr-only'>Ask AI to find a game</DialogTitle>
              <div className='flex items-center gap-3 border-b border-border px-5 py-4'>
                <span className='text-lg text-primary'>✦</span>
                <input
                  data-testid='ai-search-input'
                  value={query}
                  readOnly={pending}
                  maxLength={MAX_AI_QUERY_LENGTH}
                  placeholder='Describe the game you want…'
                  aria-label='Describe the game you want'
                  onChange={(event) => {
                    setQuery(event.target.value)
                    // Enter sends the typed text unless an arrow key picks an example after it.
                    setActiveExample(-1)
                    if (state.kind === 'rejected' || state.kind === 'error') setState({ kind: 'idle' })
                  }}
                  onKeyDown={onInputKeyDown}
                  className='min-w-0 flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground'
                />
                <SubmitButton state={state} disabled={!canSubmit} onClick={() => void submit()} />
              </div>

              {state.kind === 'pending' && (
                <div className='relative h-0.5 overflow-hidden'>
                  <div className='absolute inset-y-0 w-1/3 animate-[ai-scan_1.2s_linear_infinite] bg-gradient-to-r from-transparent via-primary to-transparent' />
                </div>
              )}

              {(state.kind === 'rejected' || state.kind === 'error') && (
                <div
                  data-testid='ai-search-rejected'
                  role='alert'
                  className='flex items-center gap-2.5 bg-primary/15 px-5 py-3 text-sm'
                >
                  <span className='font-mono font-bold text-primary'>!</span>
                  <span className='font-semibold text-foreground'>
                    {state.kind === 'rejected'
                      ? 'AI search only finds games.'
                      : 'The AI feature is temporarily unavailable.'}
                  </span>
                  <span className='text-muted-foreground'>
                    {state.kind === 'rejected'
                      ? 'Pick an example below or describe a game.'
                      : 'Please try again later.'}
                  </span>
                </div>
              )}

              {state.kind === 'result' ? (
                <ResultChips chips={state.chips} fallback={state.fallback} />
              ) : (
                <div className={cn('px-2 py-3 transition-opacity', state.kind === 'pending' && 'opacity-35')}>
                  <p className='px-3 pb-1.5 font-mono text-xs font-medium uppercase text-muted-foreground'>
                    {state.kind === 'pending' ? 'Reading your request…' : 'Try asking'}
                  </p>
                  {AI_SEARCH_EXAMPLES.map((example, index) => (
                    <button
                      key={example.text}
                      type='button'
                      data-testid='ai-search-example'
                      disabled={pending}
                      onClick={() => fillExample(example.text)}
                      className={cn(rowStyles, 'group hover:bg-secondary', index === activeExample && 'bg-secondary')}
                    >
                      <span
                        className={cn(
                          'font-mono',
                          index === activeExample ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                        )}
                      >
                        ↳
                      </span>
                      <span data-testid='ai-search-example-text' className='flex-1 text-foreground'>
                        {example.text}
                      </span>
                      <span className='hidden font-mono text-xs text-muted-foreground sm:inline'>{example.sets}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className='flex items-center gap-3 border-t border-border bg-background px-5 py-3'>
                <p data-testid='ai-search-hint' className='flex-1 text-xs text-muted-foreground'>
                  Finds games in this store only. Other questions are rejected.
                </p>
                <div className='hidden items-center gap-3 font-mono text-xs text-muted-foreground sm:flex'>
                  {[
                    ['↑↓', 'pick'],
                    ['↵', 'search'],
                    ['esc', 'close'],
                  ].map(([key, label]) => (
                    <span key={key} className='flex items-center gap-1.5'>
                      <kbd className='rounded border border-border px-1.5 py-0.5'>{key}</kbd>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
    </>
  )
}

const SubmitButton = ({
  state,
  disabled,
  onClick,
}: {
  state: PaletteState
  disabled: boolean
  onClick: () => void
}) => {
  const done = state.kind === 'result' && state.totalGames !== undefined
  const searching = state.kind === 'pending' || (state.kind === 'result' && !done)

  let label = (
    <>
      Find games <span className='font-mono'>↵</span>
    </>
  )
  if (searching) {
    label = (
      <>
        Searching… <Loader2 className='h-3.5 w-3.5 animate-spin' />
      </>
    )
  } else if (done) {
    label = (
      <>
        {state.totalGames} {state.totalGames === 1 ? 'game' : 'games'} <Check className='h-3.5 w-3.5' />
      </>
    )
  }

  return (
    <button
      type='button'
      data-testid='ai-search-submit'
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors',
        done ? 'bg-success' : 'bg-primary',
        disabled && !done && 'opacity-60',
      )}
    >
      {label}
    </button>
  )
}

const ResultChips = ({ chips, fallback }: { chips: AiFilterChip[]; fallback: boolean }) => (
  <div data-testid='ai-search-result' className='flex flex-col gap-3 px-5 pb-4 pt-4'>
    <p className='font-mono text-xs font-medium uppercase text-muted-foreground'>AI set these filters</p>
    <div className='flex flex-wrap gap-2'>
      {chips.map((chip, index) => (
        <span
          key={chip.key}
          data-testid='ai-filter-chip'
          style={{ viewTransitionName: aiTransitionName(chip.key), animationDelay: `${index * CHIP_STAGGER_MS}ms` }}
          className='animate-[ai-rise_200ms_ease-out_both] rounded border border-primary bg-secondary px-3 py-2 text-sm text-foreground'
        >
          {chip.label}
        </span>
      ))}
    </div>
    {fallback && <p className='text-xs text-muted-foreground'>AI is not available. Searching titles instead.</p>}
  </div>
)
