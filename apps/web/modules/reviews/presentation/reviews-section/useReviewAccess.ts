import { useIsAuthenticated } from '@/modules/auth/core/facade'
import { useGetOwnedItems } from '@/modules/games/integration/repository'

import { ownsGame } from '../../domain/models'

export type ReviewAccess = 'guest' | 'loading' | 'not-owner' | 'owner'

// What the signed-in state allows. It only decides what to show: the API
// refuses a review from a user who did not buy the game.
export const useReviewAccess = (gameId: number): ReviewAccess => {
  const isAuthenticated = useIsAuthenticated()
  const { data: owned, isLoading } = useGetOwnedItems({ query: { enabled: isAuthenticated } })

  if (!isAuthenticated) return 'guest'
  if (isLoading) return 'loading'
  return ownsGame(owned, gameId) ? 'owner' : 'not-owner'
}
