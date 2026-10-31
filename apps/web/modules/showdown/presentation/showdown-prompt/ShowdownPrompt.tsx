'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

import { PROMPT_DELAY_MS } from '../../configuration/constraints'
import { useMarkShowdownPromptSeen, useShowdownPromptSeen } from '../../core/facade'

// A non-modal card in the bottom corner of the home page. It never takes focus or blocks the page.
export const ShowdownPrompt = () => {
  const seen = useShowdownPromptSeen()
  const markSeen = useMarkShowdownPromptSeen()
  const [isDue, setIsDue] = useState(false)

  useEffect(() => {
    if (seen) return
    const timer = window.setTimeout(() => setIsDue(true), PROMPT_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [seen])

  if (seen || !isDue) return null

  return (
    <section
      aria-label='Showdown'
      data-testid='showdown-prompt'
      className='fixed inset-x-4 bottom-4 z-40 flex flex-col gap-3 rounded-lg border border-ink border-t-primary bg-panel-alt p-6 shadow-xl [border-top-width:3px] sm:left-auto sm:w-96'
    >
      <div className='flex items-center justify-between'>
        <p className='font-mono text-xs uppercase tracking-wide text-primary'>Showdown</p>
        <button
          type='button'
          aria-label='Close'
          data-testid='showdown-prompt-close'
          onClick={markSeen}
          className='rounded p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
        >
          <X aria-hidden='true' className='h-4 w-4' />
        </button>
      </div>
      <p className='font-display text-xl font-bold text-foreground'>
        Don&apos;t know what to play? Start a Showdown and figure it out.
      </p>
      <p className='text-sm text-muted-foreground'>
        Pick genres, then keep one game out of two until a winner is left.
      </p>
      <div className='flex items-center gap-2 pt-1'>
        <Link
          href='/showdown'
          data-testid='showdown-prompt-try'
          onClick={markSeen}
          className='rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_90%,black)] focus-visible:ring-2 focus-visible:ring-ring'
        >
          Try it
        </Link>
        <button
          type='button'
          data-testid='showdown-prompt-dismiss'
          onClick={markSeen}
          className='rounded-md px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
        >
          Not now
        </button>
      </div>
    </section>
  )
}
