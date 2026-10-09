'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Button, Skeleton } from '@repo/ui'

import { ReviewForm } from '../review-form/ReviewForm'
import { ReviewList } from '../review-list/ReviewList'
import { ReviewsEmptyState } from '../reviews-empty-state/ReviewsEmptyState'
import { ReviewsSummary } from '../reviews-summary/ReviewsSummary'

import { ReviewAccess, useReviewAccess } from './useReviewAccess'

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

// Below the average card. While the game has no review the empty state holds
// the login and purchase actions, so only the form shows here.
const ReviewAction = ({ gameId, access, isEmpty }: { gameId: number; access: ReviewAccess; isEmpty: boolean }) => {
  if (access === 'owner') return <ReviewForm gameId={gameId} />
  if (isEmpty) return null
  if (access === 'loading') return <Skeleton className='h-40 w-full' />
  if (access === 'guest') {
    return (
      <MessageCard testId='review-login-prompt'>
        <p className='font-sans text-sm font-semibold text-foreground'>Log in to review games you own.</p>
        <Button asChild variant='secondary'>
          <Link href='/login'>Log in</Link>
        </Button>
      </MessageCard>
    )
  }
  return (
    <MessageCard testId='review-owner-required'>
      <p className='font-sans text-sm font-semibold text-foreground'>Buy this game to review it</p>
    </MessageCard>
  )
}

export const ReviewsSection = ({ gameId, averageRating, reviewCount }: ReviewsSectionProps) => {
  const access = useReviewAccess(gameId)
  const isEmpty = averageRating === null || reviewCount === 0

  return (
    <section data-testid='reviews-section' className='flex flex-col gap-6'>
      <h2 className='font-display text-2xl font-medium text-foreground'>Reviews</h2>
      <div className='grid gap-8 lg:grid-cols-[400px_1fr] lg:gap-12'>
        <div className='flex flex-col gap-6'>
          {isEmpty ? (
            <ReviewsEmptyState access={access} />
          ) : (
            <ReviewsSummary averageRating={averageRating} reviewCount={reviewCount} />
          )}
          <ReviewAction gameId={gameId} access={access} isEmpty={isEmpty} />
        </div>
        <ReviewList gameId={gameId} />
      </div>
    </section>
  )
}
