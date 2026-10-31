import { SHOWDOWN_SIZES, ShowdownSize } from '../configuration/constraints'

import { ShowdownGame, ShowdownProgress } from './models'

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Replays the picks over the round-1 order. Undo is the same replay with one pick less.
// A pick that is not in its match is ignored.
export function replayBracket(games: ShowdownGame[], picks: number[]): ShowdownProgress {
  const roundCount = Math.log2(games.length)
  const losersByRound: ShowdownGame[][] = []
  let entrants = games
  let pickIndex = 0

  for (let roundIndex = 0; entrants.length > 1; roundIndex++) {
    const matchCount = entrants.length / 2
    const next: ShowdownGame[] = []
    losersByRound.push([])
    for (let matchIndex = 0; matchIndex < matchCount; matchIndex++) {
      const a = entrants[matchIndex * 2]
      const b = entrants[matchIndex * 2 + 1]
      const pick = picks[pickIndex]
      if (pick !== a.id && pick !== b.id) {
        return { roundIndex, roundCount, matchIndex, matchCount, match: [a, b], winner: null, runnersUp: [] }
      }
      pickIndex++
      next.push(pick === a.id ? a : b)
      losersByRound[roundIndex].push(pick === a.id ? b : a)
    }
    entrants = next
  }

  const runnersUp = [...(losersByRound.at(-1) ?? []), ...(losersByRound.at(-2) ?? [])]
  return {
    roundIndex: roundCount - 1,
    roundCount,
    matchIndex: 0,
    matchCount: 1,
    match: null,
    winner: entrants[0] ?? null,
    runnersUp,
  }
}

export function progressLabel({ roundIndex, roundCount, matchIndex, matchCount }: ShowdownProgress) {
  if (roundIndex === roundCount - 1) return 'Final'
  const round = roundIndex === roundCount - 2 ? 'Semifinal' : `Round ${roundIndex + 1} of ${roundCount}`
  return `${round} · Match ${matchIndex + 1} of ${matchCount}`
}

export const picksFor = (size: number) => size - 1

// Every size, enabled when the pool holds enough games.
export const sizeOptions = (poolSize: number) =>
  SHOWDOWN_SIZES.map((size) => ({ size, picks: picksFor(size), enabled: size <= poolSize }))

// Keeps the chosen size while the pool allows it, else the largest size that fits.
export function fitSize(size: ShowdownSize, poolSize: number): ShowdownSize {
  if (size <= poolSize) return size
  const fitting = SHOWDOWN_SIZES.filter((option) => option <= poolSize)
  return fitting.at(-1) ?? size
}
