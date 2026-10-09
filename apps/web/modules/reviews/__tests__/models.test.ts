import { describe, expect, it } from 'vitest'

import {
  formatAverageRating,
  formatRepliesToggle,
  formatReviewCount,
  formatReviewDate,
  ownsGame,
  pageOfNextReply,
  parseReviewParam,
  starsLabel,
} from '../domain/models'

describe('reviews domain', () => {
  it('formats the average with one decimal', () => {
    expect(formatAverageRating(5)).toBe('5.0')
    expect(formatAverageRating(4.5)).toBe('4.5')
  })

  it('uses the singular for one review', () => {
    expect(formatReviewCount(1)).toBe('1 review')
    expect(formatReviewCount(12)).toBe('12 reviews')
  })

  it('formats the date in UTC', () => {
    expect(formatReviewDate('2026-10-08T23:30:00.000Z')).toBe('Oct 8, 2026')
  })

  it('labels the stars for a screen reader', () => {
    expect(starsLabel(4)).toBe('4 out of 5 stars')
  })

  it('counts a physical edition as owning the game', () => {
    const owned = [{ gameId: 3, editionId: 9 }]

    expect(ownsGame(owned, 3)).toBe(true)
    expect(ownsGame(owned, 4)).toBe(false)
    expect(ownsGame(undefined, 3)).toBe(false)
  })

  it('labels the replies toggle with the count, or Reply when there is none', () => {
    expect(formatRepliesToggle(0)).toBe('Reply')
    expect(formatRepliesToggle(3)).toBe('Replies (3)')
  })

  it('finds the page of the next reply', () => {
    expect(pageOfNextReply(0)).toBe(1)
    expect(pageOfNextReply(9)).toBe(1)
    expect(pageOfNextReply(10)).toBe(2)
  })

  it('reads a review id from the URL and ignores anything else', () => {
    expect(parseReviewParam('42')).toBe(42)
    for (const raw of [null, undefined, '', '0', '-3', '4.5', 'abc', '12abc', '12345678901']) {
      expect(parseReviewParam(raw), String(raw)).toBeNull()
    }
  })
})
