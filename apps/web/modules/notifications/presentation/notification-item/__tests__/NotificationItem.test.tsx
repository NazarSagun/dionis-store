import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils/utils'

import { NotificationItem } from '../NotificationItem'

describe('<NotificationItem /> restock', () => {
  it('reads "<game> (<edition>) is back in stock" and links to the game page', () => {
    render(
      <NotificationItem
        notification={{
          id: 1,
          type: 'restock',
          gameId: 3,
          gameTitle: 'Ironclad Siege',
          editionName: "Collector's Edition",
          createdAt: '2026-10-27T12:00:00.000Z',
        }}
        onOpen={vi.fn()}
        onRead={vi.fn()}
      />,
    )

    expect(screen.getByTestId('notification-item')).toHaveTextContent(
      "Ironclad Siege (Collector's Edition) is back in stock",
    )
    expect(screen.getByTestId('notification-link')).toHaveAttribute('href', '/game/3')
  })
})
