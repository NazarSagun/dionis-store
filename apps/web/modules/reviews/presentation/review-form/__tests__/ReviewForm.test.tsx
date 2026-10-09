import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, waitFor } from '@/test-utils/utils'

import { ReviewForm } from '../ReviewForm'

const TIMEOUT = 3000
const noSavedReview = (gameId: number) =>
  http.get(`*/games/${gameId}/review`, () => HttpResponse.json({ message: 'none' }, { status: 404 }))

describe('<ReviewForm />', () => {
  it('keeps the submit button disabled until a star is picked', async () => {
    serviceWorker.use(noSavedReview(301))

    render(<ReviewForm gameId={301} />)

    expect(screen.getByTestId('review-submit')).toBeDisabled()
    expect(screen.getByTestId('review-submit')).toHaveTextContent('Submit review')

    await userEvent.click(screen.getByRole('button', { name: 'Rate 4 out of 5' }))

    expect(screen.getByTestId('review-submit')).toBeEnabled()
  })

  it('counts the typed text', async () => {
    serviceWorker.use(noSavedReview(302))

    render(<ReviewForm gameId={302} />)
    await userEvent.type(screen.getByTestId('review-body-input'), '12345')

    expect(screen.getByTestId('review-counter')).toHaveTextContent('5 / 1000')
  })

  it('sends the rating and the text', async () => {
    let sent: unknown
    serviceWorker.use(
      noSavedReview(303),
      http.put('*/games/303/review', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ id: 1, rating: 5, body: 'Great', createdAt: '2026-10-08', updatedAt: '2026-10-08' })
      }),
    )

    render(<ReviewForm gameId={303} />)
    await userEvent.click(screen.getByRole('button', { name: 'Rate 5 out of 5' }))
    await userEvent.type(screen.getByTestId('review-body-input'), 'Great')
    await userEvent.click(screen.getByTestId('review-submit'))

    await waitFor(() => expect(sent).toEqual({ rating: 5, body: 'Great' }), { timeout: TIMEOUT })
  })

  it('fills in the saved review and offers to update it', async () => {
    serviceWorker.use(
      http.get('*/games/304/review', () =>
        HttpResponse.json({ id: 1, rating: 3, body: 'Fine', createdAt: '2026-10-08', updatedAt: '2026-10-08' }),
      ),
    )

    render(<ReviewForm gameId={304} />)

    await waitFor(() => expect(screen.getByTestId('review-body-input')).toHaveValue('Fine'), { timeout: TIMEOUT })
    expect(screen.getByRole('button', { name: 'Rate 3 out of 5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('review-submit')).toHaveTextContent('Update review')
  })

  it('shows the API error and keeps the typed text', async () => {
    serviceWorker.use(
      noSavedReview(305),
      http.put('*/games/305/review', () =>
        HttpResponse.json({ message: 'You can only review games you own.' }, { status: 403 }),
      ),
    )

    render(<ReviewForm gameId={305} />)
    await userEvent.click(screen.getByRole('button', { name: 'Rate 4 out of 5' }))
    await userEvent.type(screen.getByTestId('review-body-input'), 'Keep me')
    await userEvent.click(screen.getByTestId('review-submit'))

    expect(await screen.findByTestId('review-error', {}, { timeout: TIMEOUT })).toHaveTextContent(
      'You can only review games you own.',
    )
    expect(screen.getByTestId('review-body-input')).toHaveValue('Keep me')
    expect(screen.getByTestId('review-submit')).toBeEnabled()
  })
})
