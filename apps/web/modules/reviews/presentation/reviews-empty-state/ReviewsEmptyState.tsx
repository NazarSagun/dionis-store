'use client'

import Link from 'next/link'
import { Button, Skeleton } from '@repo/ui'

import { REVIEW_FORM_ID } from '../review-form/ReviewForm'
import { ReviewAccess } from '../reviews-section/useReviewAccess'

// The element that holds the edition buttons on the game page.
export const PURCHASE_OPTIONS_ID = 'purchase-options'

const focusReviewForm = () => {
  const form = document.getElementById(REVIEW_FORM_ID)
  form?.scrollIntoView({ block: 'center' })
  form?.querySelector<HTMLButtonElement>('button')?.focus()
}

// Replaces the average card while the game has no review. Each state of the
// visitor gets one action that leads to the first review.
export const ReviewsEmptyState = ({ access }: { access: ReviewAccess }) => (
  <div data-testid='reviews-empty' className='flex flex-col gap-3 rounded-md border border-border bg-card p-6'>
    <h3 className='font-display text-lg font-medium text-foreground'>No reviews yet</h3>

    {access === 'loading' && <Skeleton className='h-10 w-40' />}

    {access === 'guest' && (
      <div data-testid='review-login-prompt' className='flex flex-col items-start gap-4'>
        <p className='font-sans text-sm text-muted-foreground'>
          Log in to review games you own, and be the first to rate this one.
        </p>
        <Button asChild variant='secondary'>
          <Link href='/login'>Log in</Link>
        </Button>
      </div>
    )}

    {access === 'not-owner' && (
      <div data-testid='review-owner-required' className='flex flex-col items-start gap-4'>
        <p className='font-sans text-sm text-muted-foreground'>Buy this game to review it</p>
        <Button asChild variant='secondary'>
          <a href={`#${PURCHASE_OPTIONS_ID}`}>See purchase options</a>
        </Button>
      </div>
    )}

    {access === 'owner' && (
      <div className='flex flex-col items-start gap-4'>
        <p className='font-sans text-sm text-muted-foreground'>You own this game. Be the first to review it.</p>
        <Button data-testid='review-write-first' onClick={focusReviewForm}>
          Write the first review
        </Button>
      </div>
    )}
  </div>
)
