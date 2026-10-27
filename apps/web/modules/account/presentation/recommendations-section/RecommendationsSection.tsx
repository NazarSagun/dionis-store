import { useRef } from 'react'

import { accountSeeds, excludedIds } from '@/modules/games/domain/recommendations'
import { Recommendations } from '@/modules/games/presentation/recommendations/Recommendations'

import { useRecentlyViewedGameIds } from '../../core/facade'
import { useGetOwnedItems } from '../../integration/repository'

export const RecommendationsSection = () => {
  const { data: owned } = useGetOwnedItems()
  // Read once: a view recorded while the page is open must not change the strip.
  const recentlyViewed = useRef(useRecentlyViewedGameIds()).current

  const ownedGameIds = (owned ?? []).map((item) => item.gameId)
  const { seeds, title } = accountSeeds(recentlyViewed, ownedGameIds)

  return (
    <Recommendations
      title={title}
      seedGameIds={seeds}
      excludeGameIds={excludedIds(seeds, ownedGameIds)}
      enabled={owned !== undefined}
    />
  )
}
