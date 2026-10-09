import Link from 'next/link'

import { formatRelativeTime } from '../../domain/models'
import { Notification } from '../../integration/repository'

interface NotificationItemProps {
  notification: Notification
  // Called when the user follows the link, so the notification can be marked.
  onOpen: (id: number) => void
  onRead: (id: number) => void
}

export const NotificationItem = ({ notification, onOpen, onRead }: NotificationItemProps) => (
  <li
    data-testid='notification-item'
    className='flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0'
  >
    <Link
      data-testid='notification-link'
      href={`/game/${notification.gameId}?review=${notification.reviewId}`}
      onClick={() => onOpen(notification.id)}
      className='flex min-w-0 flex-1 flex-col gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <span className='break-words font-sans text-sm text-foreground'>
        <strong className='font-semibold'>{notification.actorName}</strong> replied to a review of{' '}
        <strong className='font-semibold'>{notification.gameTitle}</strong>
      </span>
      <time
        data-testid='notification-time'
        dateTime={notification.createdAt}
        className='font-sans text-xs text-muted-foreground'
      >
        {formatRelativeTime(notification.createdAt)}
      </time>
    </Link>
    <button
      type='button'
      data-testid='notification-read'
      onClick={() => onRead(notification.id)}
      className='min-h-11 shrink-0 rounded-md border border-border px-3 font-sans text-xs font-semibold text-foreground hover:bg-panel-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8'
    >
      Mark as read
    </button>
  </li>
)
