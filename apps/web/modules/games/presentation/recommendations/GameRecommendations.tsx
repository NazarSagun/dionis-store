import { useRef } from 'react'

import { useRecentlyViewedGameIds } from '@/modules/account/core/facade'
import { useIsAuthenticated } from '@/modules/auth/core/facade'

import { detailPageSeeds, excludedIds } from '../../domain/recommendations'
import { useGetOwnedItems } from '../../integration/repository'

import { Recommendations } from './Recommendations'

// The strip of the game detail page. GameDetails gives it a key per game, so a view recorded on this
// page does not change the strip until the next visit, and another game starts a new strip.
export const GameRecommendations = ({ gameId }: { gameId: number }) => {
  const isAuthenticated = useIsAuthenticated()
  const { data: owned } = useGetOwnedItems({ query: { enabled: isAuthenticated } })
  // Read once: a view recorded while the page is open must not change the strip.
  const recentlyViewed = useRef(useRecentlyViewedGameIds()).current

  return (
    <Recommendations
      title='Because you viewed'
      seedGameIds={detailPageSeeds(gameId, recentlyViewed)}
      excludeGameIds={excludedIds(
        [gameId],
        (owned ?? []).map((item) => item.gameId),
      )}
      // A signed-in user's owned games must be known first, or the strip would show them once and then change.
      enabled={!isAuthenticated || owned !== undefined}
    />
  )
}
