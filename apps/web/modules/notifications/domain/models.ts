export const BADGE_MAX = 9
export const NOTIFICATIONS_POLL_MS = 60_000

export const formatBadgeCount = (count: number) => (count > BADGE_MAX ? `${BADGE_MAX}+` : String(count))

export const bellLabel = (unreadCount: number) =>
  unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'} ago`

// How long ago a notification arrived. After two days it shows the date.
export const formatRelativeTime = (isoDate: string, now = Date.now()) => {
  const age = now - new Date(isoDate).getTime()
  if (age < MINUTE) return 'Just now'
  if (age < HOUR) return plural(Math.floor(age / MINUTE), 'minute')
  if (age < DAY) return plural(Math.floor(age / HOUR), 'hour')
  if (age < 2 * DAY) return 'Yesterday'
  return dateFormat.format(new Date(isoDate))
}
