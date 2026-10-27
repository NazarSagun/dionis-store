import { APIRequestContext, expect, Page, test } from '@playwright/test'

import { apiToken, apiUrl, createGameViaApi, logOut, signUpCustomer } from './helpers/admin'
import {
  addEditionToCart,
  completePayment,
  fillShippingAddress,
  goToPaymentStep,
  openFirstGameDetails,
  signUpAndAddGamesToCart,
} from './helpers/checkout'

// TDD spec for reviews-spec.md (roadmap 2.3): a user who bought a game rates
// it from 1 to 5 and can write a short review. The game detail page shows the
// average rating and the reviews. These tests are written before the code
// exists, so they fail until the feature is built.
// Design: https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=327-353
//
// A purchase goes through Stripe's test API and takes several seconds, so
// only the tests that need an owner buy a game. The tests about the list,
// the pages, and the load error mock the reviews response instead.

const PASSWORD = 'password123'

function reviewUrl(gameId: number | string) {
  return `${apiUrl}/api/games/${gameId}/review`
}

async function authHeaders(request: APIRequestContext, email: string) {
  return {
    Authorization: `Bearer ${await apiToken(request, email, PASSWORD)}`,
  }
}

// Creates a new game, so no review from another test is on it, then buys it as
// a digital copy with a new player. Returns the player's email and the game id.
async function buyFreshGame(page: Page, request: APIRequestContext) {
  const { id: gameId } = await createGameViaApi(request)
  const email = await signUpCustomer(page)
  await page.goto(`/game/${gameId}`)
  await page.getByRole('button', { name: /add digital copy/i }).click()
  await goToPaymentStep(page)
  await completePayment(page)
  await page.getByTestId('finish-button').click()
  await page.goto(`/game/${gameId}`)
  return { email, gameId }
}

async function pickStars(page: Page, count: number) {
  await page
    .getByTestId('review-star')
    .nth(count - 1)
    .click()
}

async function submitReview(page: Page, stars: number, body?: string) {
  await pickStars(page, stars)
  if (body !== undefined) await page.getByTestId('review-body-input').fill(body)
  await page.getByTestId('review-submit').click()
}

function mockedReview(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: index,
    rating: (index % 5) + 1,
    body: `Mock review number ${index}`,
    authorName: `Player ${index}`,
    createdAt: new Date(Date.UTC(2026, 9, 8, 12, 0, 0) - index * 3_600_000).toISOString(),
    ...overrides,
  }
}

test.describe('Reviews section for visitors', () => {
  test('shows the empty state and a login prompt, and no form, to a signed-out visitor', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)

    await page.goto(`/game/${id}`)

    await expect(page.getByTestId('reviews-section')).toBeVisible()
    await expect(page.getByTestId('reviews-empty')).toHaveText(/no reviews yet/i)
    await expect(page.getByTestId('reviews-average')).toHaveCount(0)
    await expect(page.getByTestId('reviews-count')).toHaveCount(0)
    await expect(page.getByTestId('review-item')).toHaveCount(0)
    await expect(page.getByTestId('review-form')).toHaveCount(0)
    await expect(page.getByTestId('review-login-prompt')).toBeVisible()
  })

  test('logging in from the empty state returns to the game page', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    const email = await signUpCustomer(page)
    await logOut(page)
    await page.goto(`/game/${id}`)

    await page
      .getByTestId('review-login-prompt')
      .getByRole('link', { name: /log in/i })
      .click()
    await expect(page).toHaveURL(new RegExp(`/login\\?next=%2Fgame%2F${id}$`))
    await page.getByTestId('email').fill(email)
    await page.getByTestId('password').fill(PASSWORD)
    await page.getByTestId('submit-button').click()

    await expect(page).toHaveURL(new RegExp(`/game/${id}$`))
    await expect(page.getByTestId('review-owner-required')).toBeVisible()
  })

  test('shows the average rating, the count, and one item per review', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    await page.route(`**/api/games/${id}/reviews*`, (route) =>
      route.fulfill({
        json: {
          totalPages: 1,
          reviews: [mockedReview(1, { rating: 5 }), mockedReview(2, { rating: 4 })],
        },
      }),
    )
    await page.route(`**/api/game/${id}`, async (route) => {
      const response = await route.fetch()
      await route.fulfill({
        response,
        json: {
          ...(await response.json()),
          averageRating: 4.5,
          reviewCount: 2,
        },
      })
    })

    await page.goto(`/game/${id}`)

    await expect(page.getByTestId('reviews-average')).toHaveText('4.5')
    await expect(page.getByTestId('reviews-count')).toHaveText('2 reviews')
    const items = page.getByTestId('review-item')
    await expect(items).toHaveCount(2)
    await expect(items.first().getByTestId('review-author')).toHaveText('Player 1')
    await expect(items.first().getByTestId('review-stars')).toHaveAttribute('aria-label', '5 out of 5 stars')
    await expect(items.first().getByTestId('review-body')).toHaveText('Mock review number 1')
    await expect(items.first().getByTestId('review-date')).not.toBeEmpty()
    await expect(items.nth(1).getByTestId('review-stars')).toHaveAttribute('aria-label', '4 out of 5 stars')
  })

  test('shows 10 reviews on page 1 and the last one on page 2', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    const all = Array.from({ length: 11 }, (_, index) => mockedReview(index + 1))
    await page.route(`**/api/games/${id}/reviews*`, (route) => {
      const requested = Number(new URL(route.request().url()).searchParams.get('page') ?? '1')
      const reviews = requested === 1 ? all.slice(0, 10) : all.slice(10)
      return route.fulfill({ json: { totalPages: 2, reviews } })
    })

    await page.goto(`/game/${id}`)

    const items = page.getByTestId('review-item')
    await expect(items).toHaveCount(10)
    await expect(page.getByTestId('reviews-prev-page')).toBeDisabled()

    await page.getByTestId('reviews-next-page').click()

    await expect(items).toHaveCount(1)
    await expect(items.first().getByTestId('review-author')).toHaveText('Player 11')
    await expect(page.getByTestId('reviews-next-page')).toBeDisabled()

    await page.getByTestId('reviews-prev-page').click()

    await expect(items).toHaveCount(10)
  })

  test('shows review text as plain text, never as HTML', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    await page.route(`**/api/games/${id}/reviews*`, (route) =>
      route.fulfill({
        json: {
          totalPages: 1,
          reviews: [mockedReview(1, { body: '<b>hi</b>' })],
        },
      }),
    )

    await page.goto(`/game/${id}`)

    const body = page.getByTestId('review-body')
    await expect(body).toHaveText('<b>hi</b>')
    await expect(body.locator('b')).toHaveCount(0)
  })

  test('never shows an email address in the reviews', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    await page.route(`**/api/games/${id}/reviews*`, (route) =>
      route.fulfill({
        json: { totalPages: 1, reviews: [mockedReview(1), mockedReview(2)] },
      }),
    )

    await page.goto(`/game/${id}`)

    await expect(page.getByTestId('review-item')).toHaveCount(2)
    await expect(page.getByTestId('reviews-section')).not.toContainText('@')
  })

})

test.describe('Reviews for a signed-in user who does not own the game', () => {
  test('shows the buy prompt and no form', async ({ page, request }) => {
    const { id } = await createGameViaApi(request)
    await signUpCustomer(page)

    await page.goto(`/game/${id}`)

    await expect(page.getByTestId('review-owner-required')).toHaveText(/buy this game to review it/i)
    await expect(page.getByTestId('review-form')).toHaveCount(0)
    await expect(page.getByTestId('review-login-prompt')).toHaveCount(0)
  })

})

test.describe('Reviews API without a token', () => {
})

test.describe('Reviews from an owner', () => {
  // Each test buys a game through Stripe's test API first.
  test.describe.configure({ timeout: 90_000 })

  test('the owner submits, edits, and reloads a review, and the average follows', async ({ page, request }) => {
    await buyFreshGame(page, request)
    const form = page.getByTestId('review-form')
    await expect(form).toBeVisible()
    await expect(page.getByTestId('reviews-empty')).toContainText(/be the first to review it/i)
    await page.getByTestId('review-write-first').click()
    await expect(page.getByTestId('review-star').first()).toBeFocused()
    await expect(page.getByTestId('review-submit')).toBeDisabled()
    await expect(page.getByTestId('review-submit')).toHaveText(/submit review/i)

    await submitReview(page, 5, 'Great game, worth every cent.')

    const items = page.getByTestId('review-item')
    await expect(items).toHaveCount(1)
    await expect(items.first().getByTestId('review-stars')).toHaveAttribute('aria-label', '5 out of 5 stars')
    await expect(items.first().getByTestId('review-body')).toHaveText('Great game, worth every cent.')
    await expect(page.getByTestId('reviews-average')).toHaveText('5.0')
    await expect(page.getByTestId('reviews-count')).toHaveText('1 review')

    await page.reload()

    await expect(page.getByTestId('review-submit')).toHaveText(/update review/i)
    await expect(page.getByTestId('review-body-input')).toHaveValue('Great game, worth every cent.')

    await submitReview(page, 3)

    await expect(items).toHaveCount(1)
    await expect(items.first().getByTestId('review-stars')).toHaveAttribute('aria-label', '3 out of 5 stars')
    await expect(page.getByTestId('reviews-average')).toHaveText('3.0')
    await expect(page.getByTestId('reviews-count')).toHaveText('1 review')
  })

  test('a buyer of only the physical edition can review the game', async ({ page, request }) => {
    const email = await signUpAndAddGamesToCart(page, 0)
    await addEditionToCart(page, /standard/i)
    await goToPaymentStep(page)
    await fillShippingAddress(page, {
      name: 'E2E Reviewer',
      line1: '1 Test Street',
      city: 'Lisbon',
      postalCode: '1000-001',
      country: 'PT',
    })
    await completePayment(page)
    await page.getByTestId('finish-button').click()
    await openFirstGameDetails(page)
    const gameId = Number(new URL(page.url()).pathname.split('/').pop())

    await expect(page.getByTestId('review-form')).toBeVisible()
    const put = await request.put(reviewUrl(gameId), {
      headers: await authHeaders(request, email),
      data: { rating: 5, body: 'Physical copy review.' },
    })
    expect(put.status()).toBe(200)
  })

})
