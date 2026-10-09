import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/modules/auth/core/store'
import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen } from '@/test-utils/utils'

import { ReviewsSection } from '../ReviewsSection'

const mockPathname = vi.hoisted(() => ({ value: null as string | null }))
vi.mock('next/navigation', () => ({ usePathname: () => mockPathname.value }))

const TIMEOUT = 3000
const signIn = () => useAuthStore.setState({ isAuthenticated: true, accessToken: 't', user: null, role: null })
const emptyList = (gameId: number) =>
  http.get(`*/games/${gameId}/reviews`, () => HttpResponse.json({ totalPages: 1, reviews: [] }))

describe('<ReviewsSection />', () => {
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
})
