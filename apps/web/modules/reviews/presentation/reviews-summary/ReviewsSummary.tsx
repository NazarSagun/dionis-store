import { formatAverageRating, formatReviewCount } from '../../domain/models'
import { Stars } from '../stars/Stars'

interface ReviewsSummaryProps {
  averageRating: number | null
  reviewCount: number
}

export const ReviewsSummary = ({ averageRating, reviewCount }: ReviewsSummaryProps) => (
  <div data-testid='reviews-summary' className='flex flex-col gap-3 rounded-md border border-border bg-card p-6'>
    {averageRating === null ? (
      <>
        <h3 data-testid='reviews-empty' className='font-display text-lg font-medium text-foreground'>
          No reviews yet
        </h3>
        <p className='font-sans text-sm text-muted-foreground'>Be the first to review this game.</p>
      </>
    ) : (
      <>
        <span className='font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          Average rating
        </span>
        <div className='flex items-center gap-4'>
          <span data-testid='reviews-average' className='font-display text-6xl font-bold text-foreground'>
            {formatAverageRating(averageRating)}
          </span>
          <div className='flex flex-col gap-1'>
            <Stars rating={averageRating} size={22} data-testid='reviews-average-stars' />
            <span data-testid='reviews-count' className='font-sans text-sm text-muted-foreground'>
              {formatReviewCount(reviewCount)}
            </span>
          </div>
        </div>
      </>
    )}
  </div>
)
