'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Skeleton } from '@repo/ui'

import { useIsAuthenticated } from '@/modules/auth/core/facade'
import { useGetOwnedItems } from '@/modules/games/integration/repository'

import { ownsGame } from '../../domain/models'
import { ReviewForm } from '../review-form/ReviewForm'
import { ReviewList } from '../review-list/ReviewList'
import { ReviewsSummary } from '../reviews-summary/ReviewsSummary'

interface ReviewsSectionProps {
  gameId: number
  averageRating: number | null
  reviewCount: number
}

const MessageCard = ({ testId, children }: { testId: string; children: ReactNode }) => (
  <div data-testid={testId} className='flex flex-col items-start gap-4 rounded-md border border-border bg-card p-6'>
    {children}
  </div>
)

// The ownership check only decides what to show. The API refuses a review
// from a user who did not buy the game.
const ReviewAction = ({ gameId }: { gameId: number }) => {
  const isAuthenticated = useIsAuthenticated()
  const { data: owned, isLoading } = useGetOwnedItems({ query: { enabled: isAuthenticated } })

  if (!isAuthenticated) {
    return (
      <MessageCard testId='review-login-prompt'>
        <p className='font-sans text-sm font-semibold text-foreground'>Log in to review games you own.</p>
        <Link
          href='/login'
          className='inline-flex h-10 items-center rounded-md border-2 border-ink bg-secondary px-4 font-display text-xs uppercase tracking-wide text-secondary-foreground'
        >
          Log in
        </Link>
      </MessageCard>
    )
  }
  if (isLoading) return <Skeleton className='h-40 w-full' />
  if (!ownsGame(owned, gameId)) {
    return (
      <MessageCard testId='review-owner-required'>
        <p className='font-sans text-sm font-semibold text-foreground'>Buy this game to review it</p>
      </MessageCard>
    )
  }
  return <ReviewForm gameId={gameId} />
}

export const ReviewsSection = ({ gameId, averageRating, reviewCount }: ReviewsSectionProps) => (
  <section data-testid='reviews-section' className='flex flex-col gap-6'>
    <h2 className='font-display text-2xl font-medium text-foreground'>Reviews</h2>
    <div className='grid gap-8 lg:grid-cols-[400px_1fr] lg:gap-12'>
      <div className='flex flex-col gap-6'>
        <ReviewsSummary averageRating={averageRating} reviewCount={reviewCount} />
        <ReviewAction gameId={gameId} />
      </div>
      <ReviewList gameId={gameId} />
    </div>
  </section>
)
