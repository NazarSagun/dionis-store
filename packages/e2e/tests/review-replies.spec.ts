import { expect, Page, test } from '@playwright/test'

import { createGameViaApi, signUpCustomer } from './helpers/admin'
import {
  authHeaders,
  buyAsNewUser,
  buyGame,
  getNotifications,
  notificationReadUrl,
  notificationsReadAllUrl,
  notificationsUrl,
  registerViaApi,
  repliesUrl,
  replyViaApi,
  reviewByIdUrl,
  reviewsUrl,
  signInAgain,
  writeReviewViaApi,
} from './helpers/reviews'

// TDD spec for .claude/specs/features/reviews/review-replies-spec.md: owners
// reply to reviews in a flat thread, and the people in a thread get an in-app
// notification behind a bell in the main navigation. These tests are written
// before the code exists, so they fail until the feature is built.
// Design: https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=345-369
//
// A purchase goes through Stripe's test API and takes several seconds, so only
// the tests that need an owner buy a game. The tests about the thread display,
// the bell, and the linked review mock the API responses instead.

// The name that signUpCustomer gives every new user.
const CUSTOMER_NAME = 'E2E Customer'

function mockedReview(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: index,
    rating: (index % 5) + 1,
    body: `Mock review number ${index}`,
    authorName: `Player ${index}`,
    createdAt: new Date(Date.UTC(2026, 9, 8, 12, 0, 0) - index * 3_600_000).toISOString(),
    replyCount: 0,
    ...overrides,
  }
}

function mockedReply(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: 1000 + index,
    body: `Mock reply number ${index}`,
    authorName: `Replier ${index}`,
    createdAt: new Date(Date.UTC(2026, 9, 8, 12, 0, 0) + index * 3_600_000).toISOString(),
    ...overrides,
  }
}

// Serves a fixed review list and a matching game summary, like reviews.spec.ts.
async function mockReviews(page: Page, gameId: number, reviews: Array<Record<string, unknown>>, totalPages = 1) {
  await page.route(`**/api/games/${gameId}/reviews*`, (route) => route.fulfill({ json: { totalPages, reviews } }))
  await page.route(`**/api/game/${gameId}`, async (route) => {
    const response = await route.fetch()
    await route.fulfill({
      response,
      json: {
        ...(await response.json()),
        averageRating: 4,
        reviewCount: reviews.length,
      },
    })
  })
}

// Serves the replies of one review and records each request URL.
async function mockReplies(page: Page, reviewId: number, replies: Array<Record<string, unknown>>, totalPages = 1) {
  const requests: string[] = []
  await page.route(`**/api/reviews/${reviewId}/replies*`, (route) => {
    requests.push(route.request().url())
    return route.fulfill({ json: { totalPages, replies } })
  })
  return requests
}

// React Query refetches when the window gets focus. Sending the event keeps the
// test the same in headless runs, where no real focus change happens.
// The string form avoids the DOM types, which this package does not load.
async function focusWindow(page: Page) {
  await page.evaluate("window.dispatchEvent(new Event('focus'))")
}

test.describe('Replies and notifications API without the right user', () => {
  test('answers 401 without a token, and keeps the public reads open', async ({ request }) => {
    expect((await request.post(repliesUrl(1), { data: { body: 'Hello' } })).status()).toBe(401)
    expect((await request.get(notificationsUrl)).status()).toBe(401)
    expect((await request.post(notificationReadUrl(1))).status()).toBe(401)
    expect((await request.post(notificationsReadAllUrl)).status()).toBe(401)
  })

  test('answers 404 for a review that does not exist, and an error for a bad id', async ({ request }) => {
    const email = await registerViaApi(request)
    const headers = await authHeaders(request, email)

    expect((await request.get(repliesUrl(999_999_999))).status()).toBe(404)
    expect((await request.get(reviewByIdUrl(999_999_999))).status()).toBe(404)
    expect(
      (
        await request.post(repliesUrl(999_999_999), {
          headers,
          data: { body: 'Hello' },
        })
      ).status(),
    ).toBe(404)
    expect((await request.get(repliesUrl('abc'))).ok()).toBe(false)
    expect((await request.get(reviewByIdUrl('abc'))).ok()).toBe(false)
  })
})

test.describe('Replies API with real purchases', () => {
  // Each test buys a game through Stripe's test API first.
  test.describe.configure({ timeout: 120_000 })

  test('an owner replies, the list runs oldest first in pages of 10, and the API validates the text', async ({
    page,
    request,
  }) => {
    const { id: gameId } = await createGameViaApi(request)
    const email = await signUpCustomer(page)
    await buyGame(page, gameId)
    const reviewId = await writeReviewViaApi(request, email, gameId)

    expect(await (await request.get(repliesUrl(reviewId))).json()).toEqual({
      totalPages: expect.any(Number),
      replies: [],
    })

    const headers = await authHeaders(request, email)
    for (const body of ['', '   ', 'x'.repeat(501)]) {
      const response = await request.post(repliesUrl(reviewId), {
        headers,
        data: { body },
      })
      expect(response.status(), `body of ${body.length} characters`).toBe(400)
    }
    expect((await request.post(repliesUrl(reviewId), { headers, data: {} })).status()).toBe(400)
    expect(
      (
        await request.post(repliesUrl(reviewId), {
          headers,
          data: { body: 12 },
        })
      ).status(),
    ).toBe(400)

    const first = await replyViaApi(request, email, reviewId, 'First reply')
    expect(first.status()).toBe(201)
    expect(Object.keys(await first.json()).sort()).toEqual(['authorName', 'body', 'createdAt', 'id'])
    expect((await replyViaApi(request, email, reviewId, 'x'.repeat(500))).status()).toBe(201)
    const padded = await replyViaApi(request, email, reviewId, '  padded  ')
    expect(padded.status()).toBe(201)
    expect((await padded.json()).body).toBe('padded')

    const firstPage = await (await request.get(repliesUrl(reviewId))).json()
    expect(firstPage.replies.map((reply: { body: string }) => reply.body)).toEqual([
      'First reply',
      'x'.repeat(500),
      'padded',
    ])

    for (let index = 0; index < 8; index++) {
      expect((await replyViaApi(request, email, reviewId, `Reply ${index}`)).status()).toBe(201)
    }
    const page1 = await (await request.get(repliesUrl(reviewId))).json()
    const page2 = await (await request.get(`${repliesUrl(reviewId)}?page=2`)).json()
    expect(page1.totalPages).toBe(2)
    expect(page1.replies).toHaveLength(10)
    expect(page2.replies).toHaveLength(1)
    expect(page2.replies[0].body).toBe('Reply 7')

    expect(JSON.stringify([page1, page2])).not.toContain(email)
    const list = await (await request.get(reviewsUrl(gameId))).json()
    expect(list.reviews[0].replyCount).toBe(11)
    const single = await (await request.get(reviewByIdUrl(reviewId))).json()
    expect(single).toMatchObject({
      id: reviewId,
      gameId,
      replyCount: 11,
      rating: 5,
    })
    expect(JSON.stringify(single)).not.toContain(email)
    expect(single).not.toHaveProperty('userId')
  })

  test('a user who does not own the game gets 403 and stores nothing', async ({ page, request }) => {
    const { id: gameId } = await createGameViaApi(request)
    const owner = await signUpCustomer(page)
    await buyGame(page, gameId)
    const reviewId = await writeReviewViaApi(request, owner, gameId)
    const outsider = await registerViaApi(request)

    const response = await replyViaApi(request, outsider, reviewId, 'I never bought this.')

    expect(response.status()).toBe(403)
    expect((await (await request.get(repliesUrl(reviewId))).json()).replies).toHaveLength(0)
    expect((await getNotifications(request, owner)).unreadCount).toBe(0)
  })
})

test.describe('Notifications API with real purchases', () => {
  test.describe.configure({ timeout: 180_000 })

  test('replies notify the reviewer and earlier repliers, never the writer, and read state follows the user', async ({
    page,
    browser,
    request,
  }) => {
    const { id: gameId, title } = await createGameViaApi(request)
    const reviewer = await signUpCustomer(page)
    await buyGame(page, gameId)
    const reviewId = await writeReviewViaApi(request, reviewer, gameId)
    const replier = await buyAsNewUser(browser, gameId)

    // The reviewer answers first. Nobody else is in the thread yet.
    expect((await replyViaApi(request, reviewer, reviewId, 'My own first reply.')).status()).toBe(201)
    expect(await getNotifications(request, reviewer)).toEqual({
      unreadCount: 0,
      notifications: [],
    })

    // A reply from another owner reaches the reviewer and nobody else.
    expect((await replyViaApi(request, replier, reviewId, 'A reply from the other owner.')).status()).toBe(201)
    const first = await getNotifications(request, reviewer)
    expect(first.unreadCount).toBe(1)
    expect(Object.keys(first.notifications[0]).sort()).toEqual([
      'actorName',
      'createdAt',
      'gameId',
      'gameTitle',
      'id',
      'reviewId',
      'type',
    ])
    expect(first.notifications[0]).toMatchObject({
      type: 'review_reply',
      gameId,
      gameTitle: title,
      reviewId,
      actorName: CUSTOMER_NAME,
    })
    expect(JSON.stringify(first)).not.toContain(reviewer)
    expect(JSON.stringify(first)).not.toContain(replier)
    expect((await getNotifications(request, replier)).unreadCount).toBe(0)

    // The reviewer answers again. The earlier replier is in the thread now.
    expect((await replyViaApi(request, reviewer, reviewId, 'An answer from the reviewer.')).status()).toBe(201)
    expect((await getNotifications(request, replier)).unreadCount).toBe(1)
    expect((await getNotifications(request, reviewer)).unreadCount).toBe(1)

    // The list holds 20 rows, but the count covers all of them.
    for (let index = 0; index < 24; index++) {
      expect((await replyViaApi(request, replier, reviewId, `Bulk reply ${index}`)).status()).toBe(201)
    }
    const flood = await getNotifications(request, reviewer)
    expect(flood.unreadCount).toBe(25)
    expect(flood.notifications).toHaveLength(20)
    const ids = flood.notifications.map((notification) => notification.id)
    expect(ids).toEqual([...ids].sort((left, right) => right - left))

    // Read state belongs to one user.
    const target = flood.notifications[0]
    const replierHeaders = await authHeaders(request, replier)
    expect(
      (
        await request.post(notificationReadUrl(target.id), {
          headers: replierHeaders,
        })
      ).status(),
    ).toBe(404)
    expect((await getNotifications(request, reviewer)).unreadCount).toBe(25)

    const reviewerHeaders = await authHeaders(request, reviewer)
    expect(
      (
        await request.post(notificationReadUrl(target.id), {
          headers: reviewerHeaders,
        })
      ).status(),
    ).toBe(204)
    expect(
      (
        await request.post(notificationReadUrl(target.id), {
          headers: reviewerHeaders,
        })
      ).status(),
    ).toBe(204)
    const afterOne = await getNotifications(request, reviewer)
    expect(afterOne.unreadCount).toBe(24)
    expect(afterOne.notifications.map((notification) => notification.id)).not.toContain(target.id)

    expect(
      (
        await request.post(notificationsReadAllUrl, {
          headers: reviewerHeaders,
        })
      ).status(),
    ).toBe(204)
    expect(await getNotifications(request, reviewer)).toEqual({
      unreadCount: 0,
      notifications: [],
    })
    expect((await getNotifications(request, replier)).unreadCount).toBe(1)
  })
})

test.describe('Reply threads on the game page', () => {
  test('a signed-out visitor opens a thread, reads the replies, and sees a login prompt and no form', async ({
    page,
    request,
  }) => {
    const { id } = await createGameViaApi(request)
    await mockReviews(page, id, [mockedReview(1, { replyCount: 3 }), mockedReview(2, { replyCount: 0 })])
    const replyRequests = await mockReplies(page, 1, [
      mockedReply(1),
      mockedReply(2),
      mockedReply(3, { body: '<b>hi</b>' }),
    ])

    await page.goto(`/game/${id}`)

    const items = page.getByTestId('review-item')
    await expect(items).toHaveCount(2)
    const toggle = items.first().getByTestId('review-replies-toggle')
    await expect(toggle).toHaveText('Replies (3)')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(items.nth(1).getByTestId('review-replies-toggle')).toHaveCount(0)
    // The thread loads when it opens, not before.
    expect(replyRequests).toHaveLength(0)

    await toggle.click()

    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const thread = items.first().getByTestId('review-thread')
    await expect(thread).toBeVisible()
    const replies = thread.getByTestId('reply-item')
    await expect(replies).toHaveCount(3)
    await expect(replies.nth(0).getByTestId('reply-author')).toHaveText('Replier 1')
    await expect(replies.nth(0).getByTestId('reply-body')).toHaveText('Mock reply number 1')
    await expect(replies.nth(0).getByTestId('reply-date')).not.toBeEmpty()
    await expect(replies.nth(2).getByTestId('reply-body')).toHaveText('<b>hi</b>')
    await expect(replies.nth(2).getByTestId('reply-body').locator('b')).toHaveCount(0)
    expect(replyRequests).toHaveLength(1)

    await expect(thread.getByTestId('reply-form')).toHaveCount(0)
    await expect(thread.getByTestId('reply-owner-required')).toHaveCount(0)
    const login = thread.getByTestId('reply-login-prompt').getByRole('link', { name: /log in/i })
    await expect(login).toHaveAttribute('href', `/login?next=%2Fgame%2F${id}`)
    await expect(page.getByTestId('reviews-section')).not.toContainText('@')

    await toggle.click()

    await expect(thread).toHaveCount(0)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('loads more replies page by page', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    await mockReviews(page, id, [mockedReview(1, { replyCount: 11 })])
    const all = Array.from({ length: 11 }, (_, index) => mockedReply(index + 1))
    const requests: string[] = []
    await page.route('**/api/reviews/1/replies*', (route) => {
      requests.push(route.request().url())
      const requested = Number(new URL(route.request().url()).searchParams.get('page') ?? '1')
      return route.fulfill({
        json: {
          totalPages: 2,
          replies: requested === 1 ? all.slice(0, 10) : all.slice(10),
        },
      })
    })

    await page.goto(`/game/${id}`)
    await page.getByTestId('review-replies-toggle').click()

    const replies = page.getByTestId('reply-item')
    await expect(replies).toHaveCount(10)
    await page.getByTestId('review-replies-more').click()

    await expect(replies).toHaveCount(11)
    await expect(replies.last().getByTestId('reply-author')).toHaveText('Replier 11')
    await expect(page.getByTestId('review-replies-more')).toHaveCount(0)
    expect(requests.some((url) => new URL(url).searchParams.get('page') === '2')).toBe(true)
  })

  test('shows a load error with a retry button and keeps the rest of the page', async ({ page, request }) => {
    const { id, title } = await createGameViaApi(request)
    await mockReviews(page, id, [mockedReview(1, { replyCount: 2 })])
    let failing = true
    await page.route('**/api/reviews/1/replies*', (route) =>
      failing
        ? route.fulfill({
            status: 500,
            json: { message: 'Internal server error' },
          })
        : route.fulfill({
            json: { totalPages: 1, replies: [mockedReply(1), mockedReply(2)] },
          }),
    )

    await page.goto(`/game/${id}`)
    await page.getByTestId('review-replies-toggle').click()

    await expect(page.getByTestId('reply-load-error')).toBeVisible()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByTestId('review-item')).toHaveCount(1)

    failing = false
    await page.getByTestId('reply-retry').click()

    await expect(page.getByTestId('reply-item')).toHaveCount(2)
    await expect(page.getByTestId('reply-load-error')).toHaveCount(0)
  })

  test('a signed-in user who does not own the game reads the thread and sees the buy prompt', async ({
    page,
    request,
  }) => {
    const { id } = await createGameViaApi(request)
    await mockReviews(page, id, [mockedReview(1, { replyCount: 1 }), mockedReview(2, { replyCount: 0 })])
    await mockReplies(page, 1, [mockedReply(1)])
    await signUpCustomer(page)

    await page.goto(`/game/${id}`)

    const items = page.getByTestId('review-item')
    await expect(items.nth(1).getByTestId('review-replies-toggle')).toHaveCount(0)
    await items.first().getByTestId('review-replies-toggle').click()

    await expect(items.first().getByTestId('reply-item')).toHaveCount(1)
    await expect(items.first().getByTestId('reply-owner-required')).toHaveText(/buy this game to reply/i)
    await expect(items.first().getByTestId('reply-form')).toHaveCount(0)
    await expect(items.first().getByTestId('reply-login-prompt')).toHaveCount(0)
  })
})

test.describe('Replying as an owner on the game page', () => {
  // Each test buys a game through Stripe's test API first.
  test.describe.configure({ timeout: 90_000 })

  async function ownerWithReview(page: Page, request: Parameters<typeof createGameViaApi>[0]) {
    const { id: gameId } = await createGameViaApi(request)
    const email = await signUpCustomer(page)
    await buyGame(page, gameId)
    const reviewId = await writeReviewViaApi(request, email, gameId)
    await signInAgain(page, email)
    await page.goto(`/game/${gameId}`)
    return { email, gameId, reviewId }
  }

  test('the owner opens an empty thread, writes a reply, and it stays after a reload', async ({ page, request }) => {
    await ownerWithReview(page, request)
    const item = page.getByTestId('review-item').first()
    const toggle = item.getByTestId('review-replies-toggle')
    await expect(toggle).toHaveText('Reply')

    await toggle.click()

    await expect(item.getByTestId('reply-empty')).toHaveText(/no replies yet/i)
    const input = item.getByTestId('reply-body-input')
    const submit = item.getByTestId('reply-submit')
    await expect(submit).toBeDisabled()
    await input.fill('   ')
    await expect(submit).toBeDisabled()
    await input.fill('12345')
    await expect(item.getByTestId('reply-form')).toContainText('5 / 500')
    await input.fill('Thanks for the review!')
    await expect(submit).toBeEnabled()

    await submit.click()

    await expect(item.getByTestId('reply-item')).toHaveCount(1)
    await expect(item.getByTestId('reply-body')).toHaveText('Thanks for the review!')
    await expect(item.getByTestId('reply-author')).toHaveText(CUSTOMER_NAME)
    await expect(input).toHaveValue('')
    await expect(toggle).toHaveText('Replies (1)')
    await expect(item.getByTestId('reply-empty')).toHaveCount(0)

    await page.reload()

    const again = page.getByTestId('review-item').first()
    await expect(again.getByTestId('review-replies-toggle')).toHaveText('Replies (1)')
    await again.getByTestId('review-replies-toggle').click()
    await expect(again.getByTestId('reply-body')).toHaveText('Thanks for the review!')
  })

  test('shows a sending state, then the API error, and keeps the typed text', async ({ page, request }) => {
    await ownerWithReview(page, request)
    await page.route('**/api/reviews/*/replies', async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      await new Promise((resolve) => setTimeout(resolve, 700))
      return route.fulfill({
        status: 403,
        json: { message: 'You can only reply to games you own.' },
      })
    })
    const item = page.getByTestId('review-item').first()
    await item.getByTestId('review-replies-toggle').click()
    await item.getByTestId('reply-body-input').fill('This text must survive.')

    await item.getByTestId('reply-submit').click()

    await expect(item.getByTestId('reply-submit')).toHaveText(/sending/i)
    await expect(item.getByTestId('reply-submit')).toBeDisabled()
    await expect(item.getByTestId('reply-error')).toHaveText(/you can only reply to games you own/i)
    await expect(item.getByTestId('reply-body-input')).toHaveValue('This text must survive.')
    await expect(item.getByTestId('reply-submit')).toBeEnabled()
    await expect(item.getByTestId('reply-submit')).toHaveText('Reply')
    await expect(item.getByTestId('reply-item')).toHaveCount(0)
  })

  test('the toggle and the text area work with the keyboard and have accessible names', async ({ page, request }) => {
    await ownerWithReview(page, request)
    const item = page.getByTestId('review-item').first()

    await item.getByTestId('review-replies-toggle').focus()
    await page.keyboard.press('Enter')

    await expect(item.getByTestId('review-replies-toggle')).toHaveAttribute('aria-expanded', 'true')
    const input = item.getByRole('textbox', { name: /reply/i })
    await input.focus()
    await page.keyboard.type('Typed with the keyboard.')
    await expect(item.getByTestId('reply-submit')).toBeEnabled()
    await item.getByTestId('reply-submit').focus()
    await page.keyboard.press('Enter')

    await expect(item.getByTestId('reply-body')).toHaveText('Typed with the keyboard.')
  })
})

test.describe('Review linked from a notification', () => {
  test('shows the linked review first with its thread open, and no second copy in the list', async ({
    page,
    request,
  }) => {
    const { id } = await createGameViaApi(request)
    const linked = mockedReview(7, {
      replyCount: 2,
      body: 'The linked review',
    })
    await mockReviews(page, id, [mockedReview(1), linked, mockedReview(3)])
    await page.route('**/api/reviews/7', (route) => route.fulfill({ json: { ...linked, gameId: id } }))
    const replyRequests = await mockReplies(page, 7, [mockedReply(1), mockedReply(2)])

    await page.goto(`/game/${id}?review=7`)

    const section = page.getByTestId('review-linked')
    await expect(section).toBeVisible()
    await expect(section.getByTestId('review-linked-label')).toHaveText(/linked from your notification/i)
    await expect(section.getByTestId('review-body')).toHaveText('The linked review')
    await expect(section.getByTestId('review-thread')).toBeVisible()
    await expect(section.getByTestId('reply-item')).toHaveCount(2)
    await expect(section).toBeInViewport()
    expect(replyRequests.length).toBeGreaterThan(0)
    // The list shows the other two reviews, not the linked one again.
    await expect(page.getByTestId('review-item')).toHaveCount(2)
    await expect(page.getByTestId('review-item').filter({ hasText: 'The linked review' })).toHaveCount(0)
  })

  test('ignores a review id that does not exist, and shows the normal list with no error', async ({
    page,
    request,
  }) => {
    const { id } = await createGameViaApi(request)
    await mockReviews(page, id, [mockedReview(1), mockedReview(2)])
    await page.route('**/api/reviews/999999', (route) => route.fulfill({ status: 404, json: { message: 'Not found' } }))

    await page.goto(`/game/${id}?review=999999`)

    await expect(page.getByTestId('review-item')).toHaveCount(2)
    await expect(page.getByTestId('review-linked')).toHaveCount(0)
    await expect(page.getByTestId('reviews-load-error')).toHaveCount(0)
  })

  test('ignores a review that belongs to another game', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    await mockReviews(page, id, [mockedReview(1), mockedReview(2)])
    await page.route('**/api/reviews/8', (route) =>
      route.fulfill({
        json: {
          ...mockedReview(8, { body: 'From another game' }),
          gameId: id + 1,
        },
      }),
    )

    await page.goto(`/game/${id}?review=8`)

    await expect(page.getByTestId('review-item')).toHaveCount(2)
    await expect(page.getByTestId('review-linked')).toHaveCount(0)
    await expect(page.getByTestId('reviews-section')).not.toContainText('From another game')
  })
})

interface MockedNotification {
  id: number
  type: 'review_reply'
  gameId: number
  gameTitle: string
  reviewId: number
  actorName: string
  createdAt: string
}

function mockedNotification(id: number, overrides: Partial<MockedNotification> = {}): MockedNotification {
  return {
    id,
    type: 'review_reply',
    gameId: 1,
    gameTitle: `Game ${id}`,
    reviewId: 100 + id,
    actorName: `Replier ${id}`,
    createdAt: new Date(Date.UTC(2026, 9, 9, 12, 0, 0) - id * 60_000).toISOString(),
    ...overrides,
  }
}

// Serves the notification routes from a state object that the read routes
// change, like the real API does. `behavior.failing` makes the read routes fail.
async function mockNotifications(
  page: Page,
  state: { unreadCount: number; notifications: MockedNotification[] },
  behavior: { failing: boolean } = { failing: false },
) {
  const calls = { read: [] as number[], readAll: 0 }
  await page.route('**/api/notifications', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: state }) : route.continue(),
  )
  await page.route('**/api/notifications/*/read', (route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').at(-2))
    calls.read.push(id)
    if (behavior.failing)
      return route.fulfill({
        status: 500,
        json: { message: 'Internal server error' },
      })
    state.notifications = state.notifications.filter((notification) => notification.id !== id)
    state.unreadCount = Math.max(0, state.unreadCount - 1)
    return route.fulfill({ status: 204 })
  })
  await page.route('**/api/notifications/read-all', (route) => {
    calls.readAll += 1
    if (behavior.failing)
      return route.fulfill({
        status: 500,
        json: { message: 'Internal server error' },
      })
    state.notifications = []
    state.unreadCount = 0
    return route.fulfill({ status: 204 })
  })
  return calls
}

test.describe('Notification bell', () => {
  test('is not shown to a signed-out visitor', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('notification-bell')).toHaveCount(0)
  })

  test('shows no badge and an all-caught-up panel when nothing is unread', async ({ page }) => {
    await mockNotifications(page, { unreadCount: 0, notifications: [] })
    await signUpCustomer(page)

    const bell = page.getByTestId('notification-bell')
    await expect(bell).toBeVisible()
    await expect(page.getByTestId('notification-count')).toHaveCount(0)
    await expect(bell).toHaveAttribute('aria-label', /^Notifications/)
    await expect(bell).not.toHaveAttribute('aria-label', /unread/)

    await bell.click()

    await expect(page.getByTestId('notification-panel')).toBeVisible()
    await expect(page.getByTestId('notification-empty')).toContainText(/you are all caught up/i)
    await expect(page.getByTestId('notification-read-all')).toHaveCount(0)
  })

  test('shows the unread count on the badge, and 9+ above 9', async ({ page }) => {
    const state = {
      unreadCount: 3,
      notifications: [mockedNotification(1), mockedNotification(2), mockedNotification(3)],
    }
    await mockNotifications(page, state)
    await signUpCustomer(page)

    await expect(page.getByTestId('notification-count')).toHaveText('3')
    await expect(page.getByTestId('notification-bell')).toHaveAttribute('aria-label', 'Notifications, 3 unread')

    state.unreadCount = 10
    await focusWindow(page)

    await expect(page.getByTestId('notification-count')).toHaveText('9+')
  })

  test('lists each notification with the actor, the game, and the time', async ({ page }) => {
    await mockNotifications(page, {
      unreadCount: 2,
      notifications: [
        mockedNotification(1, {
          actorName: 'Vadym',
          gameTitle: 'Ironclad Siege',
        }),
        mockedNotification(2, {
          actorName: 'Mara K.',
          gameTitle: 'Neon Drift',
        }),
      ],
    })
    await signUpCustomer(page)

    await page.getByTestId('notification-bell').click()

    const items = page.getByTestId('notification-item')
    await expect(items).toHaveCount(2)
    await expect(items.first()).toContainText('Vadym replied to a review of Ironclad Siege')
    await expect(items.nth(1)).toContainText('Mara K. replied to a review of Neon Drift')
    await expect(items.first().getByTestId('notification-time')).not.toBeEmpty()
    await expect(page.getByTestId('notification-panel')).not.toContainText('@')
  })

  test('mark as read removes the item at once, keeps the panel open, and lowers the count', async ({ page }) => {
    const calls = await mockNotifications(page, {
      unreadCount: 3,
      notifications: [mockedNotification(1), mockedNotification(2), mockedNotification(3)],
    })
    await signUpCustomer(page)
    await page.getByTestId('notification-bell').click()
    const url = page.url()

    await page.getByTestId('notification-item').nth(1).getByTestId('notification-read').click()

    await expect(page.getByTestId('notification-item')).toHaveCount(2)
    await expect(page.getByTestId('notification-count')).toHaveText('2')
    await expect(page.getByTestId('notification-panel')).toBeVisible()
    expect(page.url()).toBe(url)
    expect(calls.read).toEqual([2])
  })

  test('puts the item and the count back when mark as read fails', async ({ page }) => {
    const behavior = { failing: true }
    await mockNotifications(
      page,
      {
        unreadCount: 2,
        notifications: [mockedNotification(1), mockedNotification(2)],
      },
      behavior,
    )
    await signUpCustomer(page)
    await page.getByTestId('notification-bell').click()

    await page.getByTestId('notification-item').first().getByTestId('notification-read').click()

    await expect(page.getByTestId('notification-item')).toHaveCount(2)
    await expect(page.getByTestId('notification-count')).toHaveText('2')
  })

  test('mark all as read clears the list and the badge, and puts them back when it fails', async ({ page }) => {
    const behavior = { failing: true }
    const calls = await mockNotifications(
      page,
      {
        unreadCount: 2,
        notifications: [mockedNotification(1), mockedNotification(2)],
      },
      behavior,
    )
    await signUpCustomer(page)
    await page.getByTestId('notification-bell').click()

    await page.getByTestId('notification-read-all').click()

    await expect(page.getByTestId('notification-item')).toHaveCount(2)
    await expect(page.getByTestId('notification-count')).toHaveText('2')

    behavior.failing = false
    await page.getByTestId('notification-read-all').click()

    await expect(page.getByTestId('notification-item')).toHaveCount(0)
    await expect(page.getByTestId('notification-empty')).toBeVisible()
    await expect(page.getByTestId('notification-count')).toHaveCount(0)
    expect(calls.readAll).toBe(2)
  })

  test('a click on a notification opens its review and marks it as read', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    const calls = await mockNotifications(page, {
      unreadCount: 1,
      notifications: [mockedNotification(5, { gameId: id, reviewId: 55 })],
    })
    await signUpCustomer(page)
    await page.getByTestId('notification-bell').click()

    await page.getByTestId('notification-item').first().getByTestId('notification-link').click()

    await expect(page).toHaveURL(new RegExp(`/game/${id}\\?review=55$`))
    await expect(page.getByTestId('notification-count')).toHaveCount(0)
    expect(calls.read).toEqual([5])
  })

  test('says how many more are unread when the list is cut at 20', async ({ page }) => {
    await mockNotifications(page, {
      unreadCount: 25,
      notifications: Array.from({ length: 20 }, (_, index) => mockedNotification(index + 1)),
    })
    await signUpCustomer(page)

    await expect(page.getByTestId('notification-count')).toHaveText('9+')
    await page.getByTestId('notification-bell').click()

    await expect(page.getByTestId('notification-item')).toHaveCount(20)
    await expect(page.getByTestId('notification-more')).toHaveText('Showing the latest 20 of 25 unread')
  })

  test('opens with the keyboard, and closes on Escape, on an outside click, and on a page change', async ({ page }) => {
    await mockNotifications(page, {
      unreadCount: 1,
      notifications: [mockedNotification(1)],
    })
    await signUpCustomer(page)
    const bell = page.getByTestId('notification-bell')
    const panel = page.getByTestId('notification-panel')

    await bell.focus()
    await page.keyboard.press('Enter')
    await expect(panel).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(bell).toBeFocused()

    await bell.click()
    await expect(panel).toBeVisible()
    await page.mouse.click(5, 400)
    await expect(panel).toHaveCount(0)

    await bell.click()
    await expect(panel).toBeVisible()
    await page.getByTestId('notification-item').first().getByTestId('notification-link').click()
    await expect(page).toHaveURL(/\/game\/\d+\?review=\d+$/)
    await expect(panel).toHaveCount(0)
  })

  test('refreshes the count when the window gets focus', async ({ page }) => {
    const state = { unreadCount: 1, notifications: [mockedNotification(1)] }
    await mockNotifications(page, state)
    await signUpCustomer(page)
    await expect(page.getByTestId('notification-count')).toHaveText('1')

    state.unreadCount = 2
    state.notifications = [mockedNotification(2), mockedNotification(1)]
    await focusWindow(page)

    await expect(page.getByTestId('notification-count')).toHaveText('2')
  })

  test('keeps the last known list and count when a refresh fails', async ({ page }) => {
    const state = {
      unreadCount: 2,
      notifications: [mockedNotification(1), mockedNotification(2)],
    }
    await mockNotifications(page, state)
    await signUpCustomer(page)
    await expect(page.getByTestId('notification-count')).toHaveText('2')

    await page.route('**/api/notifications', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            status: 500,
            json: { message: 'Internal server error' },
          })
        : route.continue(),
    )
    await focusWindow(page)
    await page.getByTestId('notification-bell').click()

    await expect(page.getByTestId('notification-count')).toHaveText('2')
    await expect(page.getByTestId('notification-item')).toHaveCount(2)
  })
})

test.describe('A reply reaches the reviewer', () => {
  test.describe.configure({ timeout: 240_000 })

  test('the reviewer sees the bell, follows it to the thread, answers, and the other owner is notified', async ({
    page,
    browser,
    request,
  }) => {
    const { id: gameId, title } = await createGameViaApi(request)
    const reviewer = await signUpCustomer(page)
    await buyGame(page, gameId)
    const reviewId = await writeReviewViaApi(request, reviewer, gameId)
    const replier = await buyAsNewUser(browser, gameId)
    expect((await replyViaApi(request, replier, reviewId, 'Glad you liked it.')).status()).toBe(201)
    await signInAgain(page, reviewer)

    await page.goto('/')
    await expect(page.getByTestId('notification-count')).toHaveText('1')
    await page.getByTestId('notification-bell').click()
    const item = page.getByTestId('notification-item')
    await expect(item).toHaveCount(1)
    await expect(item).toContainText(`${CUSTOMER_NAME} replied to a review of ${title}`)

    await item.getByTestId('notification-link').click()

    await expect(page).toHaveURL(new RegExp(`/game/${gameId}\\?review=${reviewId}$`))
    const linked = page.getByTestId('review-linked')
    await expect(linked.getByTestId('review-thread')).toBeVisible()
    await expect(linked.getByTestId('reply-body')).toHaveText('Glad you liked it.')
    await expect(page.getByTestId('notification-count')).toHaveCount(0)
    expect((await getNotifications(request, reviewer)).unreadCount).toBe(0)

    await linked.getByTestId('reply-body-input').fill('Thanks, enjoy the game!')
    await linked.getByTestId('reply-submit').click()

    await expect(linked.getByTestId('reply-item')).toHaveCount(2)
    expect((await getNotifications(request, replier)).unreadCount).toBe(1)
  })
})
