import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, waitFor } from '@/test-utils/utils'

import { ReviewList } from '../ReviewList'

// The shared QueryClient is not reset between tests, so each test uses its own game id.
const TIMEOUT = 3000

const review = (id: number, overrides = {}) => ({
  id,
  rating: 4,
  body: `Review ${id}`,
  authorName: `Player ${id}`,
  createdAt: '2026-10-08T12:00:00.000Z',
  ...overrides,
})

describe('<ReviewList />', () => {
  it('shows one page and moves to the next page', async () => {
    const all = Array.from({ length: 11 }, (_, index) => review(index + 1))
    serviceWorker.use(
      http.get('*/games/201/reviews', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1')
        return HttpResponse.json({ totalPages: 2, reviews: page === 1 ? all.slice(0, 10) : all.slice(10) })
      }),
    )

    render(<ReviewList gameId={201} />)

    expect(await screen.findAllByTestId('review-item', {}, { timeout: TIMEOUT })).toHaveLength(10)
    expect(screen.getByTestId('reviews-prev-page')).toBeDisabled()

    await userEvent.click(screen.getByTestId('reviews-next-page'))

    await waitFor(() => expect(screen.getAllByTestId('review-item')).toHaveLength(1), { timeout: TIMEOUT })
    expect(screen.getByText('Player 11')).toBeInTheDocument()
    expect(screen.getByTestId('reviews-next-page')).toBeDisabled()
  })

  it('hides the page controls when there is one page', async () => {
    serviceWorker.use(http.get('*/games/202/reviews', () => HttpResponse.json({ totalPages: 1, reviews: [review(1)] })))

    render(<ReviewList gameId={202} />)

    await screen.findByTestId('review-item', {}, { timeout: TIMEOUT })
    expect(screen.queryByTestId('reviews-next-page')).not.toBeInTheDocument()
  })

  it('shows review text as plain text', async () => {
    serviceWorker.use(
      http.get('*/games/203/reviews', () =>
        HttpResponse.json({ totalPages: 1, reviews: [review(1, { body: '<b>hi</b>' })] }),
      ),
    )

    render(<ReviewList gameId={203} />)

    const body = await screen.findByTestId('review-body', {}, { timeout: TIMEOUT })
    expect(body).toHaveTextContent('<b>hi</b>')
    expect(body.querySelector('b')).toBeNull()
  })

  it('leaves out the text paragraph for a review without text', async () => {
    serviceWorker.use(
      http.get('*/games/204/reviews', () => HttpResponse.json({ totalPages: 1, reviews: [review(1, { body: '' })] })),
    )

    render(<ReviewList gameId={204} />)

    await screen.findByTestId('review-item', {}, { timeout: TIMEOUT })
    expect(screen.queryByTestId('review-body')).not.toBeInTheDocument()
  })

  it('shows a load error and loads the list again on retry', async () => {
    let failing = true
    serviceWorker.use(
      http.get('*/games/205/reviews', () =>
        failing
          ? HttpResponse.json({ message: 'Server error' }, { status: 500 })
          : HttpResponse.json({ totalPages: 1, reviews: [review(1)] }),
      ),
    )

    render(<ReviewList gameId={205} />)

    expect(await screen.findByTestId('reviews-load-error', {}, { timeout: 8000 })).toBeInTheDocument()

    failing = false
    await userEvent.click(screen.getByTestId('reviews-retry'))

    expect(await screen.findByTestId('review-item', {}, { timeout: TIMEOUT })).toBeInTheDocument()
    expect(screen.queryByTestId('reviews-load-error')).not.toBeInTheDocument()
  }, 15000)
})
