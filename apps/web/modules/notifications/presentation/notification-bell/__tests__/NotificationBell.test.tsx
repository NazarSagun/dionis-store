import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/modules/auth/core/store'
import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, waitFor } from '@/test-utils/utils'

import { NotificationBell } from '../NotificationBell'

const TIMEOUT = 3000

const notification = (id: number, overrides = {}) => ({
  id,
  type: 'review_reply',
  gameId: 1,
  gameTitle: `Game ${id}`,
  reviewId: 100 + id,
  actorName: `Replier ${id}`,
  createdAt: '2026-10-09T12:00:00.000Z',
  ...overrides,
})

// Serves the list from a state object that the read routes change, like the API does.
const serveNotifications = (state: { unreadCount: number; notifications: Array<{ id: number }> }, failing = false) => {
  const reads: number[] = []
  serviceWorker.use(
    http.get('*/notifications', () => HttpResponse.json(state)),
    http.post('*/notifications/read-all', () => {
      if (failing) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      state.notifications = []
      state.unreadCount = 0
      return new HttpResponse(null, { status: 204 })
    }),
    http.post('*/notifications/:id/read', ({ params }) => {
      reads.push(Number(params.id))
      if (failing) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      state.notifications = state.notifications.filter((item) => item.id !== Number(params.id))
      state.unreadCount -= 1
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return reads
}

describe('<NotificationBell />', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 't', user: null, role: null })
  })

  it('shows no badge when nothing is unread, and the caught-up panel when opened', async () => {
    serveNotifications({ unreadCount: 0, notifications: [] })

    render(<NotificationBell />)
    await userEvent.click(screen.getByTestId('notification-bell'))

    expect(await screen.findByTestId('notification-empty', {}, { timeout: TIMEOUT })).toHaveTextContent(
      'You are all caught up',
    )
    expect(screen.queryByTestId('notification-count')).not.toBeInTheDocument()
    expect(screen.queryByTestId('notification-read-all')).not.toBeInTheDocument()
    expect(screen.getByTestId('notification-bell')).toHaveAttribute('aria-label', 'Notifications')
  })

  it('shows the unread count on the badge and in the label, and 9+ above 9', async () => {
    serveNotifications({ unreadCount: 12, notifications: [notification(1)] })

    render(<NotificationBell />)

    expect(await screen.findByTestId('notification-count', {}, { timeout: TIMEOUT })).toHaveTextContent('9+')
    expect(screen.getByTestId('notification-bell')).toHaveAttribute('aria-label', 'Notifications, 12 unread')
  })

  it('lists the actor and the game, and links to the review', async () => {
    serveNotifications({
      unreadCount: 1,
      notifications: [notification(1, { actorName: 'Vadym', gameTitle: 'Ironclad Siege', gameId: 7, reviewId: 55 })],
    })

    render(<NotificationBell />)
    await userEvent.click(await screen.findByTestId('notification-bell'))

    const item = await screen.findByTestId('notification-item', {}, { timeout: TIMEOUT })
    expect(item).toHaveTextContent('Vadym replied to a review of Ironclad Siege')
    expect(screen.getByTestId('notification-link')).toHaveAttribute('href', '/game/7?review=55')
  })

  it('marks one as read at once, keeps the panel open, and lowers the count', async () => {
    const reads = serveNotifications({ unreadCount: 2, notifications: [notification(1), notification(2)] })

    render(<NotificationBell />)
    await userEvent.click(await screen.findByTestId('notification-bell'))
    const buttons = await screen.findAllByTestId('notification-read', {}, { timeout: TIMEOUT })
    await userEvent.click(buttons[1])

    await waitFor(() => expect(screen.getAllByTestId('notification-item')).toHaveLength(1), { timeout: TIMEOUT })
    expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument()
    expect(reads).toEqual([2])
  })

  it('puts the item and the count back when marking as read fails', async () => {
    const reads = serveNotifications({ unreadCount: 2, notifications: [notification(1), notification(2)] }, true)

    render(<NotificationBell />)
    await userEvent.click(await screen.findByTestId('notification-bell'))
    await userEvent.click((await screen.findAllByTestId('notification-read', {}, { timeout: TIMEOUT }))[0])

    await waitFor(() => expect(reads).toEqual([1]), { timeout: TIMEOUT })
    await waitFor(() => expect(screen.getAllByTestId('notification-item')).toHaveLength(2), { timeout: TIMEOUT })
    expect(screen.getByTestId('notification-count')).toHaveTextContent('2')
  })

  it('marks all as read and clears the list and the badge', async () => {
    serveNotifications({ unreadCount: 2, notifications: [notification(1), notification(2)] })

    render(<NotificationBell />)
    await userEvent.click(await screen.findByTestId('notification-bell'))
    await userEvent.click(await screen.findByTestId('notification-read-all', {}, { timeout: TIMEOUT }))

    expect(await screen.findByTestId('notification-empty', {}, { timeout: TIMEOUT })).toBeInTheDocument()
    expect(screen.queryByTestId('notification-count')).not.toBeInTheDocument()
  })

  it('says how many are unread when the list is cut', async () => {
    serveNotifications({ unreadCount: 25, notifications: [notification(1), notification(2)] })

    render(<NotificationBell />)
    await userEvent.click(await screen.findByTestId('notification-bell'))

    expect(await screen.findByTestId('notification-more', {}, { timeout: TIMEOUT })).toHaveTextContent(
      'Showing the latest 2 of 25 unread',
    )
  })

  it('closes on Escape and gives the focus back to the bell, and closes on a click outside', async () => {
    serveNotifications({ unreadCount: 1, notifications: [notification(1)] })

    render(
      <>
        <NotificationBell />
        <button type='button'>Elsewhere</button>
      </>,
    )
    const bell = screen.getByTestId('notification-bell')
    await userEvent.click(bell)
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument()
    expect(bell).toHaveFocus()

    await userEvent.click(bell)
    await userEvent.click(screen.getByText('Elsewhere'))

    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument()
  })
})
