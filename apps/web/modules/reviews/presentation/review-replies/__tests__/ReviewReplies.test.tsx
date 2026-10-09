import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/modules/auth/core/store'
import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, waitFor } from '@/test-utils/utils'

import { ReviewReplies } from '../ReviewReplies'

vi.mock('next/navigation', () => ({ usePathname: () => '/game/1', useSearchParams: () => new URLSearchParams() }))

// The shared QueryClient is not reset between tests, so each test uses its own review and game ids.
const TIMEOUT = 3000
const signIn = () => useAuthStore.setState({ isAuthenticated: true, accessToken: 't', user: null, role: null })
const owns = (gameId: number) => http.get('*/orders/owned', () => HttpResponse.json([{ gameId, editionId: null }]))
const reply = (id: number, body = `Reply ${id}`) => ({
  id,
  body,
  authorName: `Player ${id}`,
  createdAt: '2026-10-09T12:00:00.000Z',
})

describe('<ReviewReplies />', () => {
  it('renders nothing for a signed-out visitor when there is no reply', () => {
    render(<ReviewReplies reviewId={501} gameId={601} replyCount={0} />)

    expect(screen.queryByTestId('review-replies-toggle')).not.toBeInTheDocument()
  })

  it('loads the replies when the thread opens, not before, and closes it again', async () => {
    let asked = 0
    serviceWorker.use(
      http.get('*/reviews/502/replies', () => {
        asked += 1
        return HttpResponse.json({ totalPages: 1, replies: [reply(1), reply(2, '<b>hi</b>')] })
      }),
    )

    render(<ReviewReplies reviewId={502} gameId={602} replyCount={2} />)

    const toggle = screen.getByTestId('review-replies-toggle')
    expect(toggle).toHaveTextContent('Replies (2)')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(asked).toBe(0)

    await userEvent.click(toggle)

    expect(await screen.findAllByTestId('reply-item', {}, { timeout: TIMEOUT })).toHaveLength(2)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const bodies = screen.getAllByTestId('reply-body')
    expect(bodies[1]).toHaveTextContent('<b>hi</b>')
    expect(bodies[1].querySelector('b')).toBeNull()
    expect(screen.getByTestId('reply-login-prompt')).toBeInTheDocument()
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument()

    await userEvent.click(toggle)

    expect(screen.queryByTestId('review-thread')).not.toBeInTheDocument()
  })

  it('tells a user who does not own the game to buy it', async () => {
    signIn()
    serviceWorker.use(
      http.get('*/orders/owned', () => HttpResponse.json([])),
      http.get('*/reviews/503/replies', () => HttpResponse.json({ totalPages: 1, replies: [reply(1)] })),
    )

    render(<ReviewReplies reviewId={503} gameId={603} replyCount={1} />)
    await userEvent.click(screen.getByTestId('review-replies-toggle'))

    expect(await screen.findByTestId('reply-owner-required', {}, { timeout: TIMEOUT })).toHaveTextContent(
      'Buy this game to reply',
    )
    expect(screen.queryByTestId('reply-form')).not.toBeInTheDocument()
  })

  it('lets an owner write the first reply on a review with none', async () => {
    signIn()
    let sent: unknown = null
    serviceWorker.use(
      owns(604),
      http.get('*/reviews/504/replies', () => HttpResponse.json({ totalPages: 1, replies: [] })),
      http.post('*/reviews/504/replies', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(reply(9, 'Thanks!'), { status: 201 })
      }),
    )

    render(<ReviewReplies reviewId={504} gameId={604} replyCount={0} />)

    const toggle = await screen.findByTestId('review-replies-toggle', {}, { timeout: TIMEOUT })
    expect(toggle).toHaveTextContent('Reply')
    await userEvent.click(toggle)
    expect(await screen.findByTestId('reply-empty', {}, { timeout: TIMEOUT })).toHaveTextContent('No replies yet')
    const submit = screen.getByTestId('reply-submit')
    expect(submit).toBeDisabled()

    await userEvent.type(screen.getByTestId('reply-body-input'), '   ')
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByTestId('reply-body-input'), 'Thanks!')
    expect(screen.getByTestId('reply-counter')).toHaveTextContent('10 / 500')
    await userEvent.click(submit)

    await waitFor(() => expect(sent).toEqual({ body: '   Thanks!' }), { timeout: TIMEOUT })
    await waitFor(() => expect(screen.getByTestId('reply-body-input')).toHaveValue(''), { timeout: TIMEOUT })
  })

  it('shows the API error and keeps the typed text when sending fails', async () => {
    signIn()
    serviceWorker.use(
      owns(605),
      http.get('*/reviews/505/replies', () => HttpResponse.json({ totalPages: 1, replies: [reply(1)] })),
      http.post('*/reviews/505/replies', () =>
        HttpResponse.json({ message: 'You can only reply to games you own.' }, { status: 403 }),
      ),
    )

    render(<ReviewReplies reviewId={505} gameId={605} replyCount={1} defaultOpen />)

    await userEvent.type(await screen.findByTestId('reply-body-input', {}, { timeout: TIMEOUT }), 'Keep me')
    await userEvent.click(screen.getByTestId('reply-submit'))

    expect(await screen.findByTestId('reply-error', {}, { timeout: TIMEOUT })).toHaveTextContent(
      'You can only reply to games you own.',
    )
    expect(screen.getByTestId('reply-body-input')).toHaveValue('Keep me')
    expect(screen.getByTestId('reply-submit')).toBeEnabled()
  })

  it('loads more replies one page at a time', async () => {
    const all = Array.from({ length: 11 }, (_, index) => reply(index + 1))
    serviceWorker.use(
      http.get('*/reviews/506/replies', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1')
        return HttpResponse.json({ totalPages: 2, replies: page === 1 ? all.slice(0, 10) : all.slice(10) })
      }),
    )

    render(<ReviewReplies reviewId={506} gameId={606} replyCount={11} defaultOpen />)

    expect(await screen.findAllByTestId('reply-item', {}, { timeout: TIMEOUT })).toHaveLength(10)
    await userEvent.click(screen.getByTestId('review-replies-more'))

    await waitFor(() => expect(screen.getAllByTestId('reply-item')).toHaveLength(11), { timeout: TIMEOUT })
    expect(screen.queryByTestId('review-replies-more')).not.toBeInTheDocument()
  })

  it('shows a load error and loads the replies after a retry', async () => {
    let failing = true
    serviceWorker.use(
      http.get('*/reviews/507/replies', () =>
        failing
          ? HttpResponse.json({ message: 'Server error' }, { status: 500 })
          : HttpResponse.json({ totalPages: 1, replies: [reply(1)] }),
      ),
    )

    render(<ReviewReplies reviewId={507} gameId={607} replyCount={1} defaultOpen />)

    expect(await screen.findByTestId('reply-load-error', {}, { timeout: 8000 })).toBeInTheDocument()
    failing = false
    await userEvent.click(screen.getByTestId('reply-retry'))

    expect(await screen.findByTestId('reply-item', {}, { timeout: TIMEOUT })).toBeInTheDocument()
    expect(screen.queryByTestId('reply-load-error')).not.toBeInTheDocument()
  })
})
