'use client'

import { useState } from 'react'
import { Button, Skeleton } from '@repo/ui'
import { keepPreviousData } from '@tanstack/react-query'

import { useGetGameReviews } from '../../integration/repository'
import { ReviewItem } from '../review-item/ReviewItem'

export const ReviewList = ({ gameId }: { gameId: number }) => {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useGetGameReviews(
    gameId,
    { page },
    // One retry keeps a short network blip from showing an error. The previous
    // page stays on screen while the next one loads.
    { query: { retry: 1, placeholderData: keepPreviousData } },
  )

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        data-testid='reviews-load-error'
        role='alert'
        className='flex flex-col items-start gap-4 rounded-md border border-border bg-card p-6'
      >
        <p className='font-sans text-sm font-semibold text-foreground'>
          Reviews could not load. Check your connection and try again.
        </p>
        <Button data-testid='reviews-retry' variant='secondary' onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      {data.reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
      {data.totalPages > 1 && (
        <nav aria-label='Reviews pages' className='flex items-center justify-center gap-4'>
          <Button
            data-testid='reviews-prev-page'
            variant='secondary'
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <span className='font-sans text-sm text-muted-foreground'>
            Page {page} of {data.totalPages}
          </span>
          <Button
            data-testid='reviews-next-page'
            variant='secondary'
            disabled={page >= data.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}
