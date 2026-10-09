import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/modules/auth/core/store'
import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, within } from '@/test-utils/utils'

import { ReviewsSection } from '../ReviewsSection'

const mockPathname = vi.hoisted(() => ({ value: null as string | null }))
const mockSearch = vi.hoisted(() => ({ value: '' }))
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname.value,
  useSearchParams: () => new URLSearchParams(mockSearch.value),
}))

const TIMEOUT = 3000
const signIn = () => useAuthStore.setState({ isAuthenticated: true, accessToken: 't', user: null, role: null })
const emptyList = (gameId: number) =>
  http.get(`*/games/${gameId}/reviews`, () => HttpResponse.json({ totalPages: 1, reviews: [] }))

describe('<ReviewsSection />', () => {
  // jsdom has no scrollIntoView, so some tests stub it. Put it back so the stub never leaks.
  const originalScrollIntoView = Element.prototype.scrollIntoView

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView
  })

  it('shows the empty state and a login prompt to a signed-out visitor', () => {
    serviceWorker.use(emptyList(401))

    render(<ReviewsSection gameId={401} averageRating={null} reviewCount={0} />)

    expect(screen.getByTestId('reviews-empty')).toHaveTextContent('No reviews yet')
    expect(screen.queryByTestId('reviews-average')).not.toBeInTheDocument()
    expect(screen.getByTestId('review-login-prompt')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
    expect(screen.queryByTestId('review-form')).not.toBeInTheDocument()
  })

  it('shows the average and the count', () => {
    serviceWorker.use(emptyList(402))

    render(<ReviewsSection gameId={402} averageRating={4.5} reviewCount={12} />)

    expect(screen.getByTestId('reviews-average')).toHaveTextContent('4.5')
    expect(screen.getByTestId('reviews-count')).toHaveTextContent('12 reviews')
  })

  it('tells a signed-in user who does not own the game to buy it', async () => {
    signIn()
    serviceWorker.use(
      emptyList(403),
      http.get('*/orders/owned', () => HttpResponse.json([{ gameId: 1, editionId: null }])),
    )

    render(<ReviewsSection gameId={403} averageRating={null} reviewCount={0} />)

    expect(await screen.findByTestId('review-owner-required', {}, { timeout: TIMEOUT })).toHaveTextContent(
      'Buy this game to review it',
    )
    expect(screen.queryByTestId('review-form')).not.toBeInTheDocument()
  })

  it('shows the form to a user who bought only a physical edition', async () => {
    signIn()
    serviceWorker.use(
      emptyList(404),
      http.get('*/orders/owned', () => HttpResponse.json([{ gameId: 404, editionId: 7 }])),
      http.get('*/games/404/review', () => HttpResponse.json({ message: 'none' }, { status: 404 })),
    )

    render(<ReviewsSection gameId={404} averageRating={null} reviewCount={0} />)

    expect(await screen.findByTestId('review-form', {}, { timeout: TIMEOUT })).toBeInTheDocument()
    expect(screen.queryByTestId('review-login-prompt')).not.toBeInTheDocument()
  })

  it('gives a user who does not own the game the reason only, with no button or link', async () => {
    signIn()
    serviceWorker.use(
      emptyList(405),
      http.get('*/orders/owned', () => HttpResponse.json([])),
    )

    render(<ReviewsSection gameId={405} averageRating={null} reviewCount={0} />)

    const prompt = await screen.findByTestId('review-owner-required', {}, { timeout: TIMEOUT })
    expect(prompt).toHaveTextContent('Buy this game to review it')
    expect(prompt.querySelector('a, button')).toBeNull()
    expect(screen.getAllByTestId('review-owner-required')).toHaveLength(1)
  })

  it('sends a signed-out visitor to log in and back to the page they were on', () => {
    mockPathname.value = '/game/408'
    serviceWorker.use(emptyList(408))

    render(<ReviewsSection gameId={408} averageRating={null} reviewCount={0} />)

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login?next=%2Fgame%2F408')
    mockPathname.value = null
  })

  it('lets an owner jump to the form from the empty state', async () => {
    signIn()
    serviceWorker.use(
      emptyList(406),
      http.get('*/orders/owned', () => HttpResponse.json([{ gameId: 406, editionId: null }])),
      http.get('*/games/406/review', () => HttpResponse.json({ message: 'none' }, { status: 404 })),
    )
    Element.prototype.scrollIntoView = () => {}

    render(<ReviewsSection gameId={406} averageRating={null} reviewCount={0} />)

    await userEvent.click(await screen.findByTestId('review-write-first', {}, { timeout: TIMEOUT }))

    expect(screen.getByRole('button', { name: 'Rate 1 out of 5' })).toHaveFocus()
  })

  it('shows the average card, not the empty state, once the game has reviews', async () => {
    serviceWorker.use(emptyList(407))

    render(<ReviewsSection gameId={407} averageRating={4} reviewCount={3} />)

    expect(screen.queryByTestId('reviews-empty')).not.toBeInTheDocument()
    expect(screen.getByTestId('review-login-prompt')).toBeInTheDocument()
  })

  describe('with ?review= in the URL', () => {
    const linked = {
      id: 77,
      rating: 5,
      body: 'The linked review',
      authorName: 'Mara K.',
      createdAt: '2026-10-08T12:00:00.000Z',
      replyCount: 1,
    }

    afterEach(() => {
      mockSearch.value = ''
    })

    it('shows the linked review first with its thread open, and not again in the list', async () => {
      mockSearch.value = 'review=77'
      Element.prototype.scrollIntoView = () => {}
      serviceWorker.use(
        http.get('*/games/411/reviews', () =>
          HttpResponse.json({ totalPages: 1, reviews: [{ ...linked, id: 5, body: 'Another review' }, linked] }),
        ),
        http.get('*/reviews/77', () => HttpResponse.json({ ...linked, gameId: 411 })),
        http.get('*/reviews/77/replies', () =>
          HttpResponse.json({
            totalPages: 1,
            replies: [{ id: 1, body: 'A reply', authorName: 'Tomás R.', createdAt: '2026-10-09T12:00:00.000Z' }],
          }),
        ),
      )

      render(<ReviewsSection gameId={411} averageRating={4} reviewCount={2} />)

      const section = await screen.findByTestId('review-linked', {}, { timeout: TIMEOUT })
      expect(within(section).getByTestId('review-linked-label')).toHaveTextContent('Linked from your notification')
      expect(await within(section).findByTestId('reply-body', {}, { timeout: TIMEOUT })).toHaveTextContent('A reply')
      const items = await screen.findAllByTestId('review-item', {}, { timeout: TIMEOUT })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveTextContent('Another review')
    })

    it('ignores a linked review of another game', async () => {
      mockSearch.value = 'review=78'
      serviceWorker.use(
        emptyList(412),
        http.get('*/reviews/78', () => HttpResponse.json({ ...linked, id: 78, gameId: 999 })),
      )

      render(<ReviewsSection gameId={412} averageRating={4} reviewCount={3} />)

      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(screen.queryByTestId('review-linked')).not.toBeInTheDocument()
    })

    it('ignores a value that is not a review id, without asking the API', async () => {
      mockSearch.value = 'review=abc'
      let asked = false
      serviceWorker.use(
        emptyList(413),
        http.get('*/reviews/*', () => {
          asked = true
          return HttpResponse.json({}, { status: 404 })
        }),
      )

      render(<ReviewsSection gameId={413} averageRating={4} reviewCount={3} />)

      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(screen.queryByTestId('review-linked')).not.toBeInTheDocument()
      expect(asked).toBe(false)
    })
  })
})
