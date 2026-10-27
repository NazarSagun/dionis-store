import Link from 'next/link'
import { Skeleton } from '@repo/ui'

import { RECOMMENDATIONS_LIMIT } from '../../domain/recommendations'
import { useGetGamesRecommendations } from '../../integration/repository'
import { GameCard } from '../game-card/GameCard'

interface RecommendationsProps {
  title: string
  seedGameIds: number[]
  excludeGameIds: number[]
  // False while a caller still waits for what the ids depend on, such as the owned games.
  enabled: boolean
}

// Optional content: no seeds, no result, or a failed request renders nothing, and never an error.
export const Recommendations = ({ title, seedGameIds, excludeGameIds, enabled }: RecommendationsProps) => {
  const isActive = enabled && seedGameIds.length > 0
  const { data, isLoading } = useGetGamesRecommendations(
    {
      seedGameIds: seedGameIds.join(','),
      ...(excludeGameIds.length > 0 && { excludeGameIds: excludeGameIds.join(',') }),
      limit: RECOMMENDATIONS_LIMIT,
    },
    { query: { enabled: isActive, retry: false } },
  )

  if (!isActive) return null

  if (isLoading) {
    return (
      <div
        data-testid='recommendations-skeleton'
        className='grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'
      >
        {Array.from({ length: RECOMMENDATIONS_LIMIT }, (_, index) => (
          <Skeleton key={index} className='h-[251px] w-full' />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) return null

  return (
    <div data-testid='recommendations' className='flex w-full flex-col gap-4'>
      <h2 data-testid='recommendations-title' className='font-display text-lg font-medium text-foreground'>
        {title}
      </h2>
      <div className='grid w-full grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(200px,248px))]'>
        {data.map((game) => (
          <Link key={game.id} href={`/game/${game.id}`} data-testid='recommendation-card'>
            <GameCard
              id={game.id}
              title={game.title}
              price={game.price}
              rating={game.rating}
              platform={game.platform}
              imageSrc={game.thumbnail}
              discount={game.discount}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
