'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@repo/ui'

import { formatReviewDate } from '../../domain/models'
import { Review } from '../../integration/repository'
import { ReviewReplies } from '../review-replies/ReviewReplies'
import { Stars } from '../stars/Stars'

interface ReviewItemProps {
  review: Review
  gameId: number
  // The review that a notification links to. It opens its thread and scrolls
  // into view.
  linked?: boolean
}

// The body is a React text child, so markup in a review shows as typed.
export const ReviewItem = ({ review, gameId, linked = false }: ReviewItemProps) => {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (linked) ref.current?.scrollIntoView?.({ block: 'center' })
  }, [linked])

  return (
    <article
      ref={ref}
      data-testid={linked ? 'review-linked' : 'review-item'}
      className={cn(
        'flex flex-col gap-3 rounded-md border bg-card px-6 py-5',
        linked ? 'border-foreground' : 'border-border',
      )}
    >
      {linked && (
        <p
          data-testid='review-linked-label'
          className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'
        >
          Linked from your notification
        </p>
      )}
      <div className='flex flex-wrap items-center gap-3'>
        <Stars rating={review.rating} />
        <span data-testid='review-author' className='font-sans text-sm font-semibold text-foreground'>
          {review.authorName}
        </span>
        <time
          data-testid='review-date'
          dateTime={review.createdAt}
          className='ml-auto font-sans text-xs text-muted-foreground'
        >
          {formatReviewDate(review.createdAt)}
        </time>
      </div>
      {review.body && (
        <p data-testid='review-body' className='whitespace-pre-wrap break-words font-sans text-sm text-foreground'>
          {review.body}
        </p>
      )}
      <ReviewReplies reviewId={review.id} gameId={gameId} replyCount={review.replyCount ?? 0} defaultOpen={linked} />
    </article>
  )
}
