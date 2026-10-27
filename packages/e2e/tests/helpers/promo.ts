import { APIRequestContext, Browser, expect, Page } from '@playwright/test'

import { apiToken, apiUrl, signUpCustomer, uniqueSuffix } from './admin'
import { completePayment, goToPaymentStep } from './checkout'

// Shared setup for promo-codes.spec.ts (.claude/specs/promo-codes-spec.md).

export const promoCodesUrl = `${apiUrl}/api/admin/promo-codes`
export const paymentIntentUrl = `${apiUrl}/api/orders/payment-intent`
export const promoUrl = (paymentIntentId: string) => `${paymentIntentUrl}/${paymentIntentId}/promo`

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

// Codes are 3 to 32 letters, digits, and hyphens, and are stored in uppercase.
export const uniqueCode = () => `E2E-${uniqueSuffix().replace(/[^a-z0-9]/gi, '')}`.toUpperCase().slice(0, 32)

export interface PromoCodeOptions {
  code?: string
  percentOff?: number
  maxUses?: number
  expiresAt?: string
}

// What an admin does in the panel: create a code. Returns its id and code.
export async function createPromoCode(request: APIRequestContext, options: PromoCodeOptions = {}) {
  const code = options.code ?? uniqueCode()
  const response = await request.post(promoCodesUrl, {
    headers: bearer(await apiToken(request)),
    data: {
      code,
      percentOff: options.percentOff ?? 10,
      maxUses: options.maxUses,
      expiresAt: options.expiresAt,
    },
  })
  expect(response.status()).toBe(201)
  const created = (await response.json()) as { id: number }
  return { id: created.id, code }
}

export async function listPromoCodes(request: APIRequestContext) {
  const response = await request.get(promoCodesUrl, {
    headers: bearer(await apiToken(request)),
  })
  expect(response.status()).toBe(200)
  return (await response.json()) as Array<{
    id: number
    code: string
    percentOff: number
    uses: number
  }>
}

export async function usesOf(request: APIRequestContext, code: string) {
  return (await listPromoCodes(request)).find((promo) => promo.code === code)?.uses
}

interface CartItem {
  gameId: number
  quantity: number
  editionId?: number | null
}

export async function createPaymentIntent(request: APIRequestContext, token: string, items: CartItem[]) {
  const response = await request.post(paymentIntentUrl, {
    headers: bearer(token),
    data: { items },
  })
  expect(response.status()).toBe(201)
  return (await response.json()) as { paymentIntentId: string; amount: number }
}

export const applyPromo = (request: APIRequestContext, token: string, paymentIntentId: string, code: string) =>
  request.put(promoUrl(paymentIntentId), {
    headers: bearer(token),
    data: { code },
  })

// Adds the digital copy of a game to the cart of the user who is signed in on
// `page`, and opens the Payment step.
export async function openPaymentWithGame(page: Page, gameId: number) {
  await page.goto(`/game/${gameId}`)
  await page.getByRole('button', { name: /add digital copy/i }).click()
  await goToPaymentStep(page)
  await expect(page.getByTestId('promo-code-field')).toBeVisible()
}

export async function applyPromoInUi(page: Page, code: string) {
  await page.getByTestId('promo-code-input').fill(code)
  await page.getByTestId('promo-code-apply').click()
}

// Signs up a new user in a separate browser context, pays for the digital copy
// of a game with a promo code, and returns the user's email. The user's own
// page stays free for the test.
export async function buyWithCode(browser: Browser, gameId: number, code: string) {
  const context = await browser.newContext()
  try {
    const page = await context.newPage()
    const email = await signUpCustomer(page)
    await openPaymentWithGame(page, gameId)
    await applyPromoInUi(page, code)
    await expect(page.getByTestId('promo-code-applied')).toBeVisible()
    await completePayment(page)
    return email
  } finally {
    await context.close()
  }
}
