'use client'

import { useQueryClient } from '@tanstack/react-query'

import { useIsAuthenticated } from '@/modules/auth/core/facade'
import { useGetOwnedItems } from '@/modules/games/integration/repository'

import { ownsGame } from '../domain/models'
import {
  getGetGameQueryKey,
  getGetGameReviewsQueryKey,
  getGetMyGameReviewQueryKey,
  usePutGameReview,
} from '../integration/repository'

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

// Saves the user's review, then refetches everything that shows it: the list,
// the game's average and count, and the user's own review.
export const useSaveReview = (gameId: number) => {
  const queryClient = useQueryClient()

  return usePutGameReview({
    mutation: {
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetGameReviewsQueryKey(gameId) }),
          queryClient.invalidateQueries({ queryKey: getGetGameQueryKey(gameId) }),
          queryClient.invalidateQueries({ queryKey: getGetMyGameReviewQueryKey(gameId) }),
        ]),
    },
  })
}
