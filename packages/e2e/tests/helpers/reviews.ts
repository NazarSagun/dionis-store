import { APIRequestContext, Browser, expect, Page } from '@playwright/test'

import { apiToken, apiUrl, signUpCustomer, uniqueSuffix } from './admin'
import { completePayment, goToPaymentStep } from './checkout'

// Shared setup for review-replies.spec.ts. See
// .claude/specs/features/reviews/review-replies-spec.md.

export const PASSWORD = 'password123'

export const reviewUrl = (gameId: number | string) => `${apiUrl}/api/games/${gameId}/review`
export const reviewsUrl = (gameId: number | string) => `${apiUrl}/api/games/${gameId}/reviews`
export const reviewByIdUrl = (reviewId: number | string) => `${apiUrl}/api/reviews/${reviewId}`
export const repliesUrl = (reviewId: number | string) => `${apiUrl}/api/reviews/${reviewId}/replies`
export const notificationsUrl = `${apiUrl}/api/notifications`
export const notificationReadUrl = (id: number | string) => `${apiUrl}/api/notifications/${id}/read`
export const notificationsReadAllUrl = `${apiUrl}/api/notifications/read-all`

export async function authHeaders(request: APIRequestContext, email: string) {
  return {
    Authorization: `Bearer ${await apiToken(request, email, PASSWORD)}`,
  }
}

// A user who owns nothing, created through the API so no browser is needed.
export async function registerViaApi(request: APIRequestContext) {
  const email = `e2e-replier-${uniqueSuffix()}@dionis-store.test`
  const response = await request.post(`${apiUrl}/api/register`, {
    data: { name: 'E2E Replier', email, password: PASSWORD },
  })
  expect(response.status()).toBe(201)
  return email
}

// Buys the digital copy of a game as the user who is signed in on `page`.
// A purchase goes through Stripe's test API and takes several seconds.
export async function buyGame(page: Page, gameId: number) {
  await page.goto(`/game/${gameId}`)
  await page.getByRole('button', { name: /add digital copy/i }).click()
  await goToPaymentStep(page)
  await completePayment(page)
  await page.getByTestId('finish-button').click()
}

// Signs up a new user in a separate browser context and buys the game, so the
// signed-in user of the test page stays signed in. Returns the user's email.
export async function buyAsNewUser(browser: Browser, gameId: number) {
  const context = await browser.newContext()
  try {
    const page = await context.newPage()
    const email = await signUpCustomer(page)
    await buyGame(page, gameId)
    return email
  } finally {
    await context.close()
  }
}

export async function writeReviewViaApi(
  request: APIRequestContext,
  email: string,
  gameId: number,
  rating = 5,
  body = 'A review for the reply tests.',
) {
  const response = await request.put(reviewUrl(gameId), {
    headers: await authHeaders(request, email),
    data: { rating, body },
  })
  expect(response.status()).toBe(200)
  return (await response.json()).id as number
}

export async function replyViaApi(request: APIRequestContext, email: string, reviewId: number, body: string) {
  return request.post(repliesUrl(reviewId), {
    headers: await authHeaders(request, email),
    data: { body },
  })
}

export async function getNotifications(request: APIRequestContext, email: string) {
  const response = await request.get(notificationsUrl, {
    headers: await authHeaders(request, email),
  })
  expect(response.status()).toBe(200)
  return (await response.json()) as {
    unreadCount: number
    notifications: Array<Record<string, unknown> & { id: number }>
  }
}

export async function logIn(page: Page, email: string) {
  await page.goto('/login')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill(PASSWORD)
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL('/')
}

// A login through the API replaces the refresh token of that user, which ends
// the session of the same user in the browser. Call this after the API setup
// of the user who is signed in on `page`, before the next page load.
export async function signInAgain(page: Page, email: string) {
  await page.context().clearCookies()
  await page.evaluate('localStorage.clear()')
  await logIn(page, email)
}
