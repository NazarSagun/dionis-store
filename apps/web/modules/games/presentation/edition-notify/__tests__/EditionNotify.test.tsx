import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/modules/auth/core/store'
import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, waitFor } from '@/test-utils/utils'

import { EditionNotify } from '../EditionNotify'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const TIMEOUT = 3000
const signIn = () => useAuthStore.setState({ isAuthenticated: true, accessToken: 't', user: null, role: null })

// The shared QueryClient is not reset between tests, so each test uses its own game id.
describe('<EditionNotify />', () => {
  beforeEach(() => push.mockClear())

  it('sends a guest to login and back to the game page', async () => {
    render(<EditionNotify gameId={701} editionId={1} />)

    await userEvent.click(screen.getByTestId('edition-notify'))

    expect(push).toHaveBeenCalledWith('/login?next=%2Fgame%2F701')
  })

  it('subscribes, shows Notifying you, and cancels again', async () => {
    signIn()
    serviceWorker.use(
      http.get('*/games/702/stock-alerts', () => HttpResponse.json({ editionIds: [] })),
      http.put('*/editions/1/stock-alert', () => new HttpResponse(null, { status: 204 })),
      http.delete('*/editions/1/stock-alert', () => new HttpResponse(null, { status: 204 })),
    )
    render(<EditionNotify gameId={702} editionId={1} />)
    const button = screen.getByTestId('edition-notify')
    expect(button).toHaveTextContent('Notify me')

    await userEvent.click(button)
    await waitFor(() => expect(button).toHaveTextContent('Notifying you'), { timeout: TIMEOUT })

    await userEvent.click(button)
    await waitFor(() => expect(button).toHaveTextContent('Notify me'), { timeout: TIMEOUT })
  })

  it('starts as Notifying you when the user already has an alert', async () => {
    signIn()
    serviceWorker.use(http.get('*/games/703/stock-alerts', () => HttpResponse.json({ editionIds: [1] })))
    render(<EditionNotify gameId={703} editionId={1} />)

    await waitFor(() => expect(screen.getByTestId('edition-notify')).toHaveTextContent('Notifying you'), {
      timeout: TIMEOUT,
    })
  })

  it('keeps the old text and shows an error when the request fails', async () => {
    signIn()
    serviceWorker.use(
      http.get('*/games/704/stock-alerts', () => HttpResponse.json({ editionIds: [] })),
      http.put('*/editions/1/stock-alert', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )
    render(<EditionNotify gameId={704} editionId={1} />)

    await userEvent.click(screen.getByTestId('edition-notify'))

    expect(await screen.findByTestId('edition-notify-error', {}, { timeout: TIMEOUT })).toBeInTheDocument()
    expect(screen.getByTestId('edition-notify')).toHaveTextContent('Notify me')
    expect(screen.getByTestId('edition-notify')).toBeEnabled()
  })
})
