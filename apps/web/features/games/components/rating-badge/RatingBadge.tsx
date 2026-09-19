export interface RatingBadgeProps {
  rating: string
  className?: string
}

export const RatingBadge = ({ rating, className }: RatingBadgeProps) => (
  <span
    data-testid='rating-badge'
    className={`rounded border-2 border-ink bg-neon-green p-[3px] font-mono text-sm font-bold text-ink ${className ?? ''}`}
  >
    {rating}
  </span>
)
