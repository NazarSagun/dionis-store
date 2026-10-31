'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_SHOWDOWN_SIZE, MAX_SHOWDOWN_GENRES, ShowdownSize } from '../configuration/constraints'
import { ShowdownGame } from '../domain/models'

interface ShowdownPromptState {
  seen: boolean
  markSeen: () => void
}

// Once the user answers the home prompt, it never shows again in this browser.
export const useShowdownPromptStore = create<ShowdownPromptState>()(
  persist(
    (set) => ({
      seen: false,
      markSeen: () => set({ seen: true }),
    }),
    {
      name: 'showdown-prompt-storage',
      partialize: (state) => ({ seen: state.seen }),
    },
  ),
)

export type ShowdownStatus = 'setup' | 'loading' | 'error' | 'playing'

interface ShowdownState {
  status: ShowdownStatus
  genres: string[]
  size: ShowdownSize
  // The pool in round-1 order, and the id of each kept game in pick order.
  games: ShowdownGame[]
  picks: number[]
  toggleGenre: (genre: string) => void
  setSize: (size: ShowdownSize) => void
  setStatus: (status: ShowdownStatus) => void
  begin: (games: ShowdownGame[]) => void
  pick: (gameId: number) => void
  undo: () => void
  backToSetup: () => void
}

// Not persisted: a reload starts again at the setup screen.
export const useShowdownStore = create<ShowdownState>()((set) => ({
  status: 'setup',
  genres: [],
  size: DEFAULT_SHOWDOWN_SIZE,
  games: [],
  picks: [],
  toggleGenre: (genre) =>
    set((state) => {
      if (state.genres.includes(genre)) return { genres: state.genres.filter((g) => g !== genre) }
      if (state.genres.length >= MAX_SHOWDOWN_GENRES) return state
      return { genres: [...state.genres, genre] }
    }),
  setSize: (size) => set({ size }),
  setStatus: (status) => set({ status }),
  begin: (games) => set({ status: 'playing', games, picks: [] }),
  pick: (gameId) => set((state) => ({ picks: [...state.picks, gameId] })),
  undo: () => set((state) => ({ picks: state.picks.slice(0, -1) })),
  // Keeps the genres and the size, for Restart and Play again.
  backToSetup: () => set({ status: 'setup', games: [], picks: [] }),
}))

export const initialShowdownState = {
  status: 'setup' as const,
  genres: [],
  size: DEFAULT_SHOWDOWN_SIZE,
  games: [],
  picks: [],
}
