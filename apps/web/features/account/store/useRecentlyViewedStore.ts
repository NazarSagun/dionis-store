'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_RECENTLY_VIEWED = 10

interface RecentlyViewedState {
  gameIds: number[]
  recordView: (gameId: number) => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      gameIds: [],
      recordView: (gameId) =>
        set({ gameIds: [gameId, ...get().gameIds.filter((id) => id !== gameId)].slice(0, MAX_RECENTLY_VIEWED) }),
    }),
    {
      name: 'recently-viewed-storage',
      partialize: (state) => ({ gameIds: state.gameIds }),
    },
  ),
)
