import { formatReviewDate } from '../../domain/models'
import { Review } from '../../integration/repository'
import { Stars } from '../stars/Stars'

// The body is a React text child, so markup in a review shows as typed.
export const ReviewItem = ({ review }: { review: Review }) => (
  <article data-testid='review-item' className='flex flex-col gap-3 rounded-md border border-border bg-card px-6 py-5'>
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
  </article>
)
