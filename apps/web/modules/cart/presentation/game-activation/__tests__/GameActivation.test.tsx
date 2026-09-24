import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCartStore } from '@/modules/cart/core/store'
import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, waitFor, within } from '@/test-utils/utils'

import { GameActivation } from '../GameActivation'

const writeText = vi.fn()

// The first request in each test consistently takes a bit over Testing
// Library's default 1000ms wait timeout in this MSW + jsdom setup.
const FETCH_TIMEOUT = 3000

// Each test uses its own orderId so the shared QueryClient (test-utils/utils.tsx
// does not reset it between tests) never serves one test's cached order to another.
const buildOrder = (orderId: number, overrides: { item1Activated?: boolean; item2Activated?: boolean } = {}) => ({
  id: orderId,
  items: [
    {
      id: 10,
      gameId: 1,
      quantity: 1,
      price: 5900,
      activationCode: 'K7X9-QP2M-3F8L',
      activated: overrides.item1Activated ?? false,
      game: { title: 'Cyber Racer 2088', platform: 'PC', thumbnail: 'https://example.com/thumb.jpg' },
    },
    {
      id: 11,
      gameId: 2,
      quantity: 1,
      price: 2900,
      activationCode: 'B4RC-9WZT-1H6D',
      activated: overrides.item2Activated ?? false,
      game: { title: 'Arcade Legends', platform: 'PC', thumbnail: 'https://example.com/thumb2.jpg' },
    },
  ],
})

const buildMixedOrder = (orderId: number) => ({
  id: orderId,
  shippingName: 'Alex Doe',
  shippingCity: 'Berlin',
  items: [
    {
      id: 20,
      gameId: 1,
      editionId: null,
      quantity: 1,
      price: 5900,
      activationCode: 'K7X9-QP2M-3F8L',
      activated: false,
      game: { title: 'Cyber Racer 2088', platform: 'PC', thumbnail: 'https://example.com/thumb.jpg' },
    },
    {
      id: 21,
      gameId: 1,
      editionId: 10,
      quantity: 1,
      price: 6900,
      activationCode: null,
      activated: false,
      game: { title: 'Cyber Racer 2088', platform: 'PC', thumbnail: 'https://example.com/thumb.jpg' },
      edition: { id: 10, name: 'Standard Physical Edition' },
    },
  ],
})

describe('<GameActivation />', () => {
  beforeEach(() => {
    writeText.mockReset()
    Object.assign(navigator, { clipboard: { writeText } })
  })

  it('lists every purchased game with its code and redeem link, Finish starts enabled', async () => {
    useCartStore.setState({ items: [], currentStep: 3, orderId: 101 })
    serviceWorker.use(http.get('*/orders/101', () => HttpResponse.json(buildOrder(101))))

    render(<GameActivation />)

    const rows = await screen.findAllByTestId('activation-row', {}, { timeout: FETCH_TIMEOUT })
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByTestId('activation-code')).toHaveTextContent('K7X9-QP2M-3F8L')
    expect(within(rows[0]).getByTestId('activation-redeem-link')).toHaveAttribute(
      'href',
      'https://store.steampowered.com/account/registerkey',
    )
    // Activation happens on Steam, outside this store. Finish must never
    // force it - a user can finish now and activate later from their account.
    expect(screen.getByTestId('finish-button')).toBeEnabled()
  })

  it('copies the exact code to the clipboard', async () => {
    useCartStore.setState({ items: [], currentStep: 3, orderId: 102 })
    serviceWorker.use(http.get('*/orders/102', () => HttpResponse.json(buildOrder(102))))

    render(<GameActivation />)

    const rows = await screen.findAllByTestId('activation-row', {}, { timeout: FETCH_TIMEOUT })
    within(rows[0]).getByTestId('activation-copy').click()

    expect(writeText).toHaveBeenCalledWith('K7X9-QP2M-3F8L')
  })

  it('marks a row activated when its button is clicked', async () => {
    useCartStore.setState({ items: [], currentStep: 3, orderId: 103 })
    serviceWorker.use(
      http.get('*/orders/103', () => HttpResponse.json(buildOrder(103))),
      http.patch('*/orders/103/items/10/activate', () =>
        HttpResponse.json({ id: 10, activated: true, activationCode: 'K7X9-QP2M-3F8L' }),
      ),
    )

    render(<GameActivation />)

    const rows = await screen.findAllByTestId('activation-row', {}, { timeout: FETCH_TIMEOUT })
    // The PATCH succeeding invalidates the order query, which refetches -
    // the refetch must see the now-activated item.
    serviceWorker.use(http.get('*/orders/103', () => HttpResponse.json(buildOrder(103, { item1Activated: true }))))
    within(rows[0]).getByTestId('activation-mark-button').click()

    await waitFor(() => expect(within(rows[0]).getByTestId('activation-status')).toHaveTextContent(/activated/i))
  })

  it('shows a shipping row with no code for a physical item, Finish stays enabled', async () => {
    useCartStore.setState({ items: [], currentStep: 3, orderId: 105 })
    serviceWorker.use(http.get('*/orders/105', () => HttpResponse.json(buildMixedOrder(105))))

    render(<GameActivation />)

    const activationRows = await screen.findAllByTestId('activation-row', {}, { timeout: FETCH_TIMEOUT })
    expect(activationRows).toHaveLength(1)

    const shippingRows = await screen.findAllByTestId('shipping-row', {}, { timeout: FETCH_TIMEOUT })
    expect(shippingRows).toHaveLength(1)
    expect(within(shippingRows[0]).queryByTestId('activation-code')).not.toBeInTheDocument()
    expect(within(shippingRows[0]).getByTestId('shipping-note')).toHaveTextContent('Alex Doe')
    expect(within(shippingRows[0]).getByTestId('shipping-note')).toHaveTextContent('Berlin')

    // Activation happens on Steam - a physical row has nothing to activate
    // either way, so it never gates Finish.
    expect(screen.getByTestId('finish-button')).toBeEnabled()
  })

  // Stubs window.location and never restores it - keep this test last in the
  // file, or any test after it can hang forever on MSW resolving a request
  // URL against a destructured window.location.
  it('Finish clears the cart and goes home even with unactivated items left', async () => {
    useCartStore.setState({ items: [], currentStep: 3, orderId: 104 })
    serviceWorker.use(http.get('*/orders/104', () => HttpResponse.json(buildOrder(104))))

    render(<GameActivation />)

    await screen.findAllByTestId('activation-row', {}, { timeout: FETCH_TIMEOUT })

    // Stub window.location only now, right before the click that navigates -
    // any earlier network requests in this test still need the real one.
    Object.defineProperty(window, 'location', { writable: true, value: { href: '' } })
    screen.getByTestId('finish-button').click()

    expect(useCartStore.getState().orderId).toBeNull()
    expect(window.location.href).toBe('/')
  })
})
