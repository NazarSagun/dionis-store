import { useId } from 'react'
import { cn } from '@repo/ui'

import { STAR_COUNT, starsLabel } from '../../domain/models'

interface StarsProps {
  // A fraction fills a star partly, so 4.5 shows four full stars and a half.
  rating: number
  size?: number
  className?: string
  'data-testid'?: string
}

const STAR_PATH = 'M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z'

export const Star = ({ fill, size }: { fill: number; size: number }) => {
  const clipId = useId()

  return (
    <svg width={size} height={size} viewBox='0 0 24 24' aria-hidden='true' className='shrink-0'>
      <path d={STAR_PATH} className='fill-border' />
      <clipPath id={clipId}>
        <rect x='0' y='0' width={24 * fill} height='24' />
      </clipPath>
      <path d={STAR_PATH} className='fill-foreground' clipPath={`url(#${clipId})`} />
    </svg>
  )
}

export const Stars = ({ rating, size = 16, className, 'data-testid': testId = 'review-stars' }: StarsProps) => (
  <span
    role='img'
    data-testid={testId}
    aria-label={starsLabel(rating)}
    className={cn('inline-flex items-center gap-1', className)}
  >
    {Array.from({ length: STAR_COUNT }, (_, index) => (
      <Star key={index} size={size} fill={Math.min(1, Math.max(0, rating - index))} />
    ))}
  </span>
)
