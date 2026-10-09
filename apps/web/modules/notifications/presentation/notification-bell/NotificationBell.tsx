'use client'

import { useEffect, useRef, useState } from 'react'

import {
  useClearNotificationsOnUnmount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../core/facade'
import { bellLabel, formatBadgeCount } from '../../domain/models'
import { NotificationPanel } from '../notification-panel/NotificationPanel'

const BellIcon = () => (
  <svg
    width={20}
    height={20}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={1.75}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
    <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
  </svg>
)

// The bell in the main navigation. It shows only for a signed-in user.
export const NotificationBell = () => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const { data } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()
  useClearNotificationsOnUnmount()

  const unreadCount = data?.unreadCount ?? 0

  // The panel closes on Escape, which returns focus to the bell, and on a
  // click outside it.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      bellRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className='sm:relative'>
      <button
        ref={bellRef}
        type='button'
        data-testid='notification-bell'
        aria-label={bellLabel(unreadCount)}
        aria-expanded={open}
        aria-haspopup='dialog'
        onClick={() => setOpen((current) => !current)}
        className='relative flex size-11 items-center justify-center rounded-md text-foreground hover:bg-panel-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-8'
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            data-testid='notification-count'
            aria-hidden='true'
            className='absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-sans text-[11px] font-semibold text-primary-foreground'
          >
            {formatBadgeCount(unreadCount)}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          data={data}
          onOpen={(id) => {
            setOpen(false)
            markRead({ id })
          }}
          onRead={(id) => markRead({ id })}
          onReadAll={() => markAllRead()}
        />
      )}
    </div>
  )
}
