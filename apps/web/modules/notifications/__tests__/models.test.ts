import { describe, expect, it } from 'vitest'

import { bellLabel, formatBadgeCount, formatRelativeTime } from '../domain/models'

describe('notifications domain', () => {
  it('shows the count on the badge, and 9+ above 9', () => {
    expect(formatBadgeCount(1)).toBe('1')
    expect(formatBadgeCount(9)).toBe('9')
    expect(formatBadgeCount(10)).toBe('9+')
    expect(formatBadgeCount(250)).toBe('9+')
  })

  it('labels the bell with the unread count only when there is one', () => {
    expect(bellLabel(0)).toBe('Notifications')
    expect(bellLabel(3)).toBe('Notifications, 3 unread')
  })

  describe('formatRelativeTime', () => {
    const now = new Date('2026-10-09T12:00:00.000Z').getTime()
    const ago = (ms: number) => new Date(now - ms).toISOString()

    it('counts minutes, then hours, then says Yesterday', () => {
      expect(formatRelativeTime(ago(10_000), now)).toBe('Just now')
      expect(formatRelativeTime(ago(60_000), now)).toBe('1 minute ago')
      expect(formatRelativeTime(ago(2 * 60_000), now)).toBe('2 minutes ago')
      expect(formatRelativeTime(ago(3 * 3_600_000), now)).toBe('3 hours ago')
      expect(formatRelativeTime(ago(30 * 3_600_000), now)).toBe('Yesterday')
    })

    it('shows the date after two days', () => {
      expect(formatRelativeTime('2026-10-06T23:30:00.000Z', now)).toBe('Oct 6, 2026')
    })
  })
})
