import { NotificationsResponse } from '../../integration/repository'
import { NotificationItem } from '../notification-item/NotificationItem'

interface NotificationPanelProps {
  data: NotificationsResponse | undefined
  onOpen: (id: number) => void
  onRead: (id: number) => void
  onReadAll: () => void
}

export const NotificationPanel = ({ data, onOpen, onRead, onReadAll }: NotificationPanelProps) => {
  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div
      data-testid='notification-panel'
      role='dialog'
      aria-label='Notifications'
      className='absolute inset-x-4 top-full z-50 mt-2 rounded-md sm:inset-x-auto sm:right-0 sm:w-[380px] border border-border bg-card shadow-lg'
    >
      <div className='flex items-center justify-between gap-3 border-b border-border px-4 py-3'>
        <h2 className='font-display text-lg font-medium text-foreground'>Notifications</h2>
        {notifications.length > 0 && (
          <button
            type='button'
            data-testid='notification-read-all'
            onClick={onReadAll}
            className='min-h-11 rounded-sm font-sans text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8'
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div data-testid='notification-empty' className='flex flex-col items-center gap-1 px-4 py-7 text-center'>
          <p className='font-sans text-sm font-semibold text-foreground'>You are all caught up</p>
          <p className='font-sans text-xs text-muted-foreground'>New replies to your reviews show up here.</p>
        </div>
      ) : (
        <ul className='max-h-[60vh] overflow-y-auto'>
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onOpen={onOpen} onRead={onRead} />
          ))}
        </ul>
      )}

      {unreadCount > notifications.length && (
        <p
          data-testid='notification-more'
          className='border-t border-border px-4 py-3 font-sans text-xs text-muted-foreground'
        >
          Showing the latest {notifications.length} of {unreadCount} unread
        </p>
      )}
    </div>
  )
}
