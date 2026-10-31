import { describe, expect, it } from 'vitest'

import { fitSize, progressLabel, replayBracket, shuffle, sizeOptions } from '../domain/bracket'
import { ShowdownGame } from '../domain/models'
import { crackPath, seededRandom, shatterCard } from '../domain/shatter'

const games = (count: number): ShowdownGame[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Game ${i + 1}`,
    thumbnail: '',
    genre: 'Shooter',
    platform: 'PC',
    rating: '4.0',
    price: 30,
    discount: 0,
  }))

describe('replayBracket', () => {
  it('starts at round 1, match 1', () => {
    const progress = replayBracket(games(8), [])
    expect(progress).toMatchObject({ roundIndex: 0, roundCount: 3, matchIndex: 0, matchCount: 4, winner: null })
    expect(progress.match?.map((game) => game.id)).toEqual([1, 2])
  })

  it('moves the kept games to the next round and the others out', () => {
    // Round 1 keeps 1, 4, 5, 8. The semifinals pair 1-4 and 5-8.
    const progress = replayBracket(games(8), [1, 4, 5, 8])
    expect(progress).toMatchObject({ roundIndex: 1, matchIndex: 0, matchCount: 2 })
    expect(progress.match?.map((game) => game.id)).toEqual([1, 4])
  })

  it('ends with a winner and the Final loser, then the Semifinal losers', () => {
    const progress = replayBracket(games(8), [1, 4, 5, 8, 4, 5, 5])
    expect(progress.match).toBeNull()
    expect(progress.winner?.id).toBe(5)
    expect(progress.runnersUp.map((game) => game.id)).toEqual([4, 1, 8])
  })

  it('undoes a pick by replaying one pick less', () => {
    expect(replayBracket(games(8), [1, 4].slice(0, -1)).matchIndex).toBe(1)
  })

  it('stops at a pick that is not in its match', () => {
    expect(replayBracket(games(8), [3]).matchIndex).toBe(0)
  })
})

describe('progressLabel', () => {
  it('numbers the early rounds and names the last two', () => {
    const sixteen = games(16)
    expect(progressLabel(replayBracket(sixteen, []))).toBe('Round 1 of 4 · Match 1 of 8')
    const toSemifinal = [1, 3, 5, 7, 9, 11, 13, 15, 1, 5, 9, 13]
    expect(progressLabel(replayBracket(sixteen, toSemifinal))).toBe('Semifinal · Match 1 of 2')
    expect(progressLabel(replayBracket(sixteen, [...toSemifinal, 1, 9]))).toBe('Final')
  })
})

describe('sizes', () => {
  it('enables each size the pool can fill', () => {
    expect(sizeOptions(21)).toEqual([
      { size: 8, picks: 7, enabled: true },
      { size: 16, picks: 15, enabled: true },
      { size: 32, picks: 31, enabled: false },
    ])
  })

  it('keeps a size that fits, else drops to the largest one that does', () => {
    expect(fitSize(16, 40)).toBe(16)
    expect(fitSize(32, 21)).toBe(16)
    expect(fitSize(16, 9)).toBe(8)
  })
})

describe('shuffle', () => {
  it('keeps every item', () => {
    expect(shuffle([1, 2, 3, 4], seededRandom(3)).sort()).toEqual([1, 2, 3, 4])
  })
})

describe('shatter', () => {
  it('cuts the card into the asked number of shards, each a polygon from the impact point', () => {
    const shards = shatterCard({ x: 40, y: 30 }, 14, seededRandom(1))
    expect(shards).toHaveLength(14)
    for (const shard of shards) expect(shard.clipPath).toMatch(/^polygon\(40\.00% 30\.00%, /)
  })

  it('draws the same cracks for the same seed', () => {
    expect(crackPath({ x: 50, y: 30 }, seededRandom(7))).toBe(crackPath({ x: 50, y: 30 }, seededRandom(7)))
  })
})
