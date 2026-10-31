import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { replayBracket, shuffle } from '../domain/bracket'
import { fetchShowdownGames } from '../integration/repository'

import { useShowdownPromptStore, useShowdownStore } from './store'

export const useShowdownPromptSeen = () => useShowdownPromptStore((state) => state.seen)
export const useMarkShowdownPromptSeen = () => useShowdownPromptStore((state) => state.markSeen)

export const useShowdownStatus = () => useShowdownStore((state) => state.status)
export const useShowdownSetup = () =>
  useShowdownStore(useShallow((state) => ({ genres: state.genres, size: state.size })))
export const useToggleShowdownGenre = () => useShowdownStore((state) => state.toggleGenre)
export const useSetShowdownSize = () => useShowdownStore((state) => state.setSize)
export const useShowdownPicks = () => useShowdownStore((state) => state.picks)
export const usePickShowdownGame = () => useShowdownStore((state) => state.pick)
export const useUndoShowdownPick = () => useShowdownStore((state) => state.undo)
export const useBackToShowdownSetup = () => useShowdownStore((state) => state.backToSetup)

export const useShowdownProgress = () => {
  const games = useShowdownStore((state) => state.games)
  const picks = useShowdownStore((state) => state.picks)
  return replayBracket(games, picks)
}

// Fetches the pool for the chosen genres and size, then shuffles it into round 1.
export const useStartShowdown = () =>
  useCallback(async () => {
    const { genres, size, setStatus, begin } = useShowdownStore.getState()
    setStatus('loading')
    try {
      begin(shuffle(await fetchShowdownGames({ genres, size })))
    } catch {
      setStatus('error')
    }
  }, [])
