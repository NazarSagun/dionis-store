'use client'

import { Skeleton } from '@repo/ui'

import { useBackToShowdownSetup, useShowdownProgress, useShowdownStatus } from '../../core/facade'
import { ShowdownBracket } from '../showdown-bracket/ShowdownBracket'
import { ShowdownSetup } from '../showdown-setup/ShowdownSetup'
import { ShowdownWinner } from '../showdown-winner/ShowdownWinner'

// The public entry: shows the screen that matches the Showdown's state.
export const Showdown = () => {
  const status = useShowdownStatus()
  const { winner } = useShowdownProgress()
  const backToSetup = useBackToShowdownSetup()

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col px-4 pb-20 pt-6 sm:px-8 sm:pt-12 lg:px-[68px]'>
      {status === 'setup' && <ShowdownSetup />}
      {status === 'loading' && (
        <div className='flex flex-col gap-4 md:flex-row'>
          <Skeleton className='aspect-video w-full' />
          <Skeleton className='aspect-video w-full' />
        </div>
      )}
      {status === 'error' && (
        <div className='flex flex-col items-start gap-4'>
          <p className='text-foreground'>Something went wrong loading the games for this Showdown. Please try again.</p>
          <button
            type='button'
            onClick={backToSetup}
            className='rounded-md border border-ink bg-panel-alt px-5 py-3 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring'
          >
            Back to setup
          </button>
        </div>
      )}
      {status === 'playing' && (winner ? <ShowdownWinner /> : <ShowdownBracket />)}
    </div>
  )
}
