interface ExternalScoresProps {
  criticRating: number | null
  criticRatingCount: number | null
  userRating: number | null
  userRatingCount: number | null
}

const count = (value: number | null, noun: string) =>
  `${(value ?? 0).toLocaleString('en-US')} ${noun}${value === 1 ? '' : 's'}`

const Score = ({ testId, label, value, detail }: { testId: string; label: string; value: number; detail: string }) => (
  <div data-testid={testId} className='flex items-center gap-4'>
    <span className='w-14 font-display text-3xl font-bold text-foreground'>{value}</span>
    <div className='flex flex-col'>
      <span className='font-sans text-sm font-semibold text-foreground'>{label}</span>
      <span className='font-sans text-xs text-muted-foreground'>{detail}</span>
    </div>
  </div>
)

// IGDB scores from 0 to 100, shown above the "Because you viewed" strip.
export const ExternalScores = ({
  criticRating,
  criticRatingCount,
  userRating,
  userRatingCount,
}: ExternalScoresProps) => {
  if (criticRating === null && userRating === null) return null

  return (
    <div data-testid='external-scores' className='flex flex-col gap-4 rounded-md border border-border bg-card p-6'>
      <span className='font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
        Scores from IGDB
      </span>
      <div className='flex flex-col gap-4 sm:flex-row sm:gap-12'>
        {criticRating !== null && (
          <Score
            testId='critic-score'
            label='Critics'
            value={criticRating}
            detail={`out of 100, ${count(criticRatingCount, 'review')}`}
          />
        )}
        {userRating !== null && (
          <Score
            testId='user-score'
            label='IGDB players'
            value={userRating}
            detail={`out of 100, ${count(userRatingCount, 'rating')}`}
          />
        )}
      </div>
    </div>
  )
}
