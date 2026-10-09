'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Button, cn } from '@repo/ui'

import { useSaveReview } from '../../core/facade'
import { REVIEW_MAX_LENGTH, STAR_COUNT } from '../../domain/models'
import { useGetMyGameReview } from '../../integration/repository'
import { Star } from '../stars/Stars'

export const REVIEW_FORM_ID = 'review-form'

export const ReviewForm = ({ gameId }: { gameId: number }) => {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  // A 404 only means the user has not reviewed the game yet, so it is not retried.
  const { data: saved } = useGetMyGameReview(gameId, { query: { retry: false } })
  const savedId = saved?.id
  useEffect(() => {
    if (saved) {
      setRating(saved.rating)
      setBody(saved.body)
    }
    // Fill the form once per saved review, not on every refetch while the user types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedId])

  const { mutate, isPending } = useSaveReview(gameId)

  let submitLabel = saved ? 'Update review' : 'Submit review'
  if (isPending) submitLabel = 'Saving…'

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (rating === 0 || isPending) return
    setError(null)
    mutate(
      { id: gameId, data: { rating, body } },
      // The typed text stays, so the user can send it again.
      { onError: (err) => setError(err.response?.data.message ?? 'Could not save your review. Try again.') },
    )
  }

  return (
    <form
      id={REVIEW_FORM_ID}
      data-testid='review-form'
      onSubmit={onSubmit}
      className='flex flex-col gap-4 rounded-md border border-border bg-card p-6'
    >
      <h3 className='font-display text-lg font-medium text-foreground'>Your review</h3>

      <div className='flex flex-col gap-2'>
        <span id='review-rating-label' className='font-sans text-sm font-semibold text-foreground'>
          Rating
        </span>
        <div role='group' aria-labelledby='review-rating-label' className='flex gap-2'>
          {Array.from({ length: STAR_COUNT }, (_, index) => {
            const value = index + 1
            return (
              <button
                key={value}
                type='button'
                data-testid='review-star'
                aria-label={`Rate ${value} out of ${STAR_COUNT}`}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
                className={cn(
                  'flex size-11 items-center justify-center rounded-md border bg-panel-alt',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  rating === value ? 'border-foreground' : 'border-border',
                )}
              >
                <Star size={22} fill={value <= rating ? 1 : 0} />
              </button>
            )
          })}
        </div>
        {rating === 0 && <span className='font-sans text-xs text-muted-foreground'>Choose 1 to 5 stars</span>}
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='review-body' className='font-sans text-sm font-semibold text-foreground'>
          Review (optional)
        </label>
        <textarea
          id='review-body'
          data-testid='review-body-input'
          value={body}
          maxLength={REVIEW_MAX_LENGTH}
          rows={5}
          placeholder='What did you like or dislike about the game?'
          onChange={(event) => setBody(event.target.value)}
          className='w-full resize-y rounded-md border border-border bg-panel-alt px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        />
        <span data-testid='review-counter' className='self-end font-sans text-xs text-muted-foreground'>
          {body.length} / {REVIEW_MAX_LENGTH}
        </span>
      </div>

      {error && (
        <p data-testid='review-error' role='alert' className='font-sans text-sm text-destructive'>
          {error}
        </p>
      )}

      <Button data-testid='review-submit' type='submit' disabled={rating === 0 || isPending}>
        {submitLabel}
      </Button>
    </form>
  )
}
