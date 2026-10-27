import { expect, test } from '@playwright/test'

import { apiToken, apiUrl, createGameViaApi, logInAsAdmin, signUpCustomer } from './helpers/admin'
import { fillStripeTestCard } from './helpers/checkout'
import { waitForReceipts } from './helpers/mail'
import {
  applyPromo,
  applyPromoInUi,
  bearer,
  buyWithCode,
  createPaymentIntent,
  createPromoCode,
  listPromoCodes,
  openPaymentWithGame,
  paymentIntentUrl,
  promoCodesUrl,
  promoUrl,
  uniqueCode,
  usesOf,
} from './helpers/promo'
import { createGameWithEdition } from './helpers/restock'
import { PASSWORD, registerViaApi } from './helpers/reviews'

// TDD spec for .claude/specs/promo-codes-spec.md. The promo models, routes,
// the code field on the Payment step, and the admin page do not exist yet, so
// these tests fail until phase 4.
// Design: Figma section "Checkout" (the Payment frames and "Promo code —
// States") and section "Admin" ("Admin — Promo codes").
//
// Every test makes its own game and its own code through the admin API, so a
// test never uses a seeded code and never changes a seeded game. The game
// costs 30.00 EUR with no discount, so a 10 percent code takes 3.00 EUR off
// and the total is 27.00 EUR. The UI shows an amount as `27.00€`.
//
// Not covered here, because they need a Stripe-signed webhook call or a race
// between two payments that the suite cannot control. The API unit tests of
// `OrdersService` cover them: the webhook path creating the order with the
// code and one use, and two orders racing for the last use of a code.
test.describe.configure({ mode: 'default' })

const tokenFor = (request: Parameters<typeof apiToken>[0], email: string) => apiToken(request, email, PASSWORD)

test.describe('Feature 1: Promo code API', () => {
  test('an admin creates a code, a duplicate is refused in any case, and other callers are refused', async ({
    request,
  }) => {
    const { code } = await createPromoCode(request, { percentOff: 10 })
    const adminToken = await apiToken(request)
    const userToken = await tokenFor(request, await registerViaApi(request))

    const duplicate = await request.post(promoCodesUrl, {
      headers: bearer(adminToken),
      data: { code: code.toLowerCase(), percentOff: 10 },
    })
    expect(duplicate.status()).toBe(409)

    expect((await request.get(promoCodesUrl, { headers: bearer(userToken) })).status()).toBe(403)
    expect((await request.get(promoCodesUrl)).status()).toBe(401)
    expect(
      (
        await request.post(promoCodesUrl, {
          data: { code: uniqueCode(), percentOff: 10 },
        })
      ).status(),
    ).toBe(401)

    const listed = (await listPromoCodes(request)).find((promo) => promo.code === code)
    expect(listed).toMatchObject({ code, percentOff: 10, uses: 0 })
  })

  test('the create body is validated', async ({ request }) => {
    const headers = bearer(await apiToken(request))
    const post = (data: Record<string, unknown>) => request.post(promoCodesUrl, { headers, data })

    expect((await post({ code: 'AB', percentOff: 10 })).status()).toBe(400)
    expect((await post({ code: 'HAS SPACE', percentOff: 10 })).status()).toBe(400)
    expect((await post({ code: uniqueCode(), percentOff: 0 })).status()).toBe(400)
    expect((await post({ code: uniqueCode(), percentOff: 101 })).status()).toBe(400)
    expect((await post({ code: uniqueCode(), percentOff: 10.5 })).status()).toBe(400)
    expect((await post({ code: uniqueCode(), percentOff: 10, maxUses: 0 })).status()).toBe(400)
    expect(
      (
        await post({
          code: uniqueCode(),
          percentOff: 10,
          expiresAt: '2020-01-01T00:00:00.000Z',
        })
      ).status(),
    ).toBe(400)
  })

  test('a code is stored in uppercase and applying it ignores case', async ({ request }) => {
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request, {
      code: uniqueCode(),
      percentOff: 10,
    })
    const token = await tokenFor(request, await registerViaApi(request))
    const { paymentIntentId, amount } = await createPaymentIntent(request, token, [{ gameId, quantity: 1 }])
    expect(amount).toBe(3000)

    const response = await applyPromo(request, token, paymentIntentId, code.toLowerCase())

    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({
      amount: 2700,
      discountCents: 300,
      code,
    })
  })

  test('the shipping fee is not discounted', async ({ request }) => {
    const { gameId, editionId } = await createGameWithEdition(request, 5)
    const { code } = await createPromoCode(request, { percentOff: 25 })
    const token = await tokenFor(request, await registerViaApi(request))
    const items = [{ gameId, quantity: 1, editionId }]
    const { paymentIntentId, amount: fullAmount } = await createPaymentIntent(request, token, items)

    const body = await (await applyPromo(request, token, paymentIntentId, code)).json()

    // The edition costs 40.00 EUR, so 25 percent is 10.00 EUR.
    expect(body.discountCents).toBe(1000)
    expect(body.amount).toBe(fullAmount - 1000)
  })

  test('a second code replaces the first, and removing the code restores the full amount', async ({ request }) => {
    const { id: gameId } = await createGameViaApi(request)
    const first = await createPromoCode(request, { percentOff: 10 })
    const second = await createPromoCode(request, { percentOff: 50 })
    const token = await tokenFor(request, await registerViaApi(request))
    const { paymentIntentId } = await createPaymentIntent(request, token, [{ gameId, quantity: 1 }])

    expect((await (await applyPromo(request, token, paymentIntentId, first.code)).json()).amount).toBe(2700)
    expect((await (await applyPromo(request, token, paymentIntentId, second.code)).json()).amount).toBe(1500)

    const removed = await request.delete(promoUrl(paymentIntentId), {
      headers: bearer(token),
    })
    expect(removed.status()).toBe(200)
    expect((await removed.json()).amount).toBe(3000)
  })

  test('an unknown code, an expired code, and a used-up code are refused with different messages', async ({
    browser,
    request,
  }) => {
    test.setTimeout(120_000)
    const { id: gameId } = await createGameViaApi(request)
    const token = await tokenFor(request, await registerViaApi(request))
    const { paymentIntentId } = await createPaymentIntent(request, token, [{ gameId, quantity: 1 }])

    const expiring = await createPromoCode(request, {
      expiresAt: new Date(Date.now() + 3_000).toISOString(),
    })
    await new Promise((resolve) => setTimeout(resolve, 3_500))
    const usedUp = await createPromoCode(request, { maxUses: 1 })
    await buyWithCode(browser, gameId, usedUp.code)

    const messages: string[] = []
    for (const code of [`NOPE-${uniqueCode()}`, expiring.code, usedUp.code]) {
      const response = await applyPromo(request, token, paymentIntentId, code)
      expect(response.status()).toBe(400)
      messages.push((await response.json()).message)
    }
    expect(new Set(messages).size).toBe(3)
  })

  test('a PaymentIntent of another user, a missing token, and a bad id are refused', async ({ request }) => {
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request)
    const owner = await tokenFor(request, await registerViaApi(request))
    const stranger = await tokenFor(request, await registerViaApi(request))
    const { paymentIntentId } = await createPaymentIntent(request, owner, [{ gameId, quantity: 1 }])

    expect((await applyPromo(request, stranger, paymentIntentId, code)).status()).toBe(404)
    expect(
      (
        await request.delete(promoUrl(paymentIntentId), {
          headers: bearer(stranger),
        })
      ).status(),
    ).toBe(404)
    expect((await request.put(promoUrl(paymentIntentId), { data: { code } })).status()).toBe(401)
    expect((await request.delete(promoUrl(paymentIntentId))).status()).toBe(401)
    expect(
      (
        await request.put(`${paymentIntentUrl}/pi_does_not_exist/promo`, {
          headers: bearer(owner),
          data: { code },
        })
      ).status(),
    ).toBe(404)
  })

  test('a paid order keeps the code and discount, counts one use, and sends a receipt with the code line', async ({
    browser,
    request,
  }) => {
    test.setTimeout(120_000)
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request, { percentOff: 10 })

    const email = await buyWithCode(browser, gameId, code)

    const orders = await request.get(`${apiUrl}/api/orders`, {
      headers: bearer(await tokenFor(request, email)),
    })
    const [order] = (await orders.json()).items
    expect(order).toMatchObject({
      promoCode: code,
      promoDiscountCents: 300,
      totalPrice: 2700,
    })
    expect(await usesOf(request, code)).toBe(1)

    const [receipt] = await waitForReceipts(request, email)
    expect(receipt.Text).toContain(`Promo code ${code}`)
    expect(receipt.HTML).toContain(code)
  })

  test('a receipt without a code has no promo line', async ({ browser, request }) => {
    test.setTimeout(120_000)
    const { id: gameId } = await createGameViaApi(request)
    const context = await browser.newContext()
    const page = await context.newPage()
    const email = await signUpCustomer(page)
    await openPaymentWithGame(page, gameId)
    await fillStripeTestCard(page, '4242424242424242')
    await page.getByTestId('payment-submit').click()
    await expect(page.getByTestId('game-activation')).toBeVisible({
      timeout: 15_000,
    })
    await context.close()

    const [receipt] = await waitForReceipts(request, email)
    expect(receipt.Text).not.toContain('Promo code')
  })

  test('a user can use a code once, another user still can, and deleting and recreating the code changes nothing', async ({
    browser,
    request,
  }) => {
    test.setTimeout(180_000)
    const { id: gameId } = await createGameViaApi(request)
    const { id: codeId, code } = await createPromoCode(request, {
      percentOff: 10,
    })
    const buyer = await buyWithCode(browser, gameId, code)
    const buyerToken = await tokenFor(request, buyer)
    const other = await registerViaApi(request)
    const otherToken = await tokenFor(request, other)
    const secondGame = (await createGameViaApi(request)).id

    const buyerIntent = await createPaymentIntent(request, buyerToken, [{ gameId: secondGame, quantity: 1 }])
    const refused = await applyPromo(request, buyerToken, buyerIntent.paymentIntentId, code)
    expect(refused.status()).toBe(400)
    expect((await refused.json()).message).toMatch(/already used/i)

    const otherIntent = await createPaymentIntent(request, otherToken, [{ gameId: secondGame, quantity: 1 }])
    expect((await applyPromo(request, otherToken, otherIntent.paymentIntentId, code)).status()).toBe(200)

    const adminHeaders = bearer(await apiToken(request))
    expect(
      (
        await request.delete(`${promoCodesUrl}/${codeId}`, {
          headers: adminHeaders,
        })
      ).status(),
    ).toBe(204)
    const again = await request.post(promoCodesUrl, {
      headers: adminHeaders,
      data: { code, percentOff: 10 },
    })
    expect(again.status()).toBe(201)
    expect((await applyPromo(request, buyerToken, buyerIntent.paymentIntentId, code)).status()).toBe(400)
  })

  test('deleting a code leaves old orders untouched and refuses an unknown id', async ({ browser, request }) => {
    test.setTimeout(120_000)
    const { id: gameId } = await createGameViaApi(request)
    const { id: codeId, code } = await createPromoCode(request, {
      percentOff: 10,
    })
    const email = await buyWithCode(browser, gameId, code)

    const adminHeaders = bearer(await apiToken(request))
    expect(
      (
        await request.delete(`${promoCodesUrl}/${codeId}`, {
          headers: adminHeaders,
        })
      ).status(),
    ).toBe(204)
    expect(
      (
        await request.delete(`${promoCodesUrl}/${codeId}`, {
          headers: adminHeaders,
        })
      ).status(),
    ).toBe(404)

    const orders = await request.get(`${apiUrl}/api/orders`, {
      headers: bearer(await tokenFor(request, email)),
    })
    expect((await orders.json()).items[0]).toMatchObject({
      promoCode: code,
      promoDiscountCents: 300,
    })
  })
})

test.describe('Feature 2: Promo code field on the Payment step', () => {
  test.beforeEach(() => test.setTimeout(90_000))

  test('a valid code shows the promo line, the lower total, and the applied state', async ({ page, request }) => {
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request, { percentOff: 10 })
    await signUpCustomer(page)
    await openPaymentWithGame(page, gameId)
    await expect(page.getByTestId('payment-summary')).toContainText('30.00€')

    await applyPromoInUi(page, code.toLowerCase())

    await expect(page.getByTestId('promo-code-applied')).toContainText(code)
    await expect(page.getByTestId('promo-code-input')).toHaveCount(0)
    await expect(page.getByTestId('summary-promo-line')).toContainText(code)
    await expect(page.getByTestId('summary-promo-line')).toContainText('3.00€')
    await expect(page.getByTestId('payment-summary')).toContainText('27.00€')
  })

  test('an unknown, expired, or used-up code shows its message and leaves the total alone', async ({
    browser,
    page,
    request,
  }) => {
    test.setTimeout(180_000)
    const { id: gameId } = await createGameViaApi(request)
    const expiring = await createPromoCode(request, {
      expiresAt: new Date(Date.now() + 3_000).toISOString(),
    })
    const usedUp = await createPromoCode(request, { maxUses: 1 })
    await buyWithCode(browser, gameId, usedUp.code)
    await signUpCustomer(page)
    await openPaymentWithGame(page, gameId)
    await new Promise((resolve) => setTimeout(resolve, 3_500))
    const error = page.getByTestId('promo-code-error')
    const messages: string[] = []

    for (const code of [`NOPE-${uniqueCode()}`, expiring.code, usedUp.code]) {
      await applyPromoInUi(page, code)
      await expect(error).toBeVisible()
      messages.push((await error.textContent()) ?? '')
      // The text the user typed stays in the field, and the total is unchanged.
      await expect(page.getByTestId('promo-code-input')).toHaveValue(code)
      await expect(page.getByTestId('payment-summary')).not.toContainText('27.00€')
      await expect(page.getByTestId('promo-code-apply')).toBeEnabled()
    }
    expect(new Set(messages).size).toBe(3)
  })

  test('an already-used code shows its own message', async ({ browser, page, request }) => {
    test.setTimeout(150_000)
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request)
    const email = await buyWithCode(browser, gameId, code)
    const secondGame = (await createGameViaApi(request)).id
    // Log in as the user who already used the code.
    await page.goto('/login')
    await page.getByTestId('email').fill(email)
    await page.getByTestId('password').fill(PASSWORD)
    await page.getByTestId('submit-button').click()
    await expect(page).toHaveURL('/')
    await openPaymentWithGame(page, secondGame)

    await applyPromoInUi(page, code)

    await expect(page.getByTestId('promo-code-error')).toContainText(/already used/i)
    await expect(page.getByTestId('payment-summary')).not.toContainText('27.00€')
  })

  test('Remove brings back the full total and the field', async ({ page, request }) => {
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request, { percentOff: 10 })
    await signUpCustomer(page)
    await openPaymentWithGame(page, gameId)
    await applyPromoInUi(page, code)
    await expect(page.getByTestId('promo-code-applied')).toBeVisible()

    await page.getByTestId('promo-code-remove').click()

    await expect(page.getByTestId('promo-code-applied')).toHaveCount(0)
    await expect(page.getByTestId('summary-promo-line')).toHaveCount(0)
    await expect(page.getByTestId('promo-code-input')).toBeVisible()
    await expect(page.getByTestId('payment-summary')).not.toContainText('27.00€')
  })

  test('a paid order uses the discounted amount', async ({ browser, request }) => {
    test.setTimeout(120_000)
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request, { percentOff: 10 })

    const email = await buyWithCode(browser, gameId, code)

    const orders = await request.get(`${apiUrl}/api/orders`, {
      headers: bearer(await apiToken(request, email, PASSWORD)),
    })
    expect((await orders.json()).items[0].totalPrice).toBe(2700)
  })

  test('a declined card keeps the code applied and the user on step 2', async ({ page, request }) => {
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request, { percentOff: 10 })
    await signUpCustomer(page)
    await openPaymentWithGame(page, gameId)
    await applyPromoInUi(page, code)
    await expect(page.getByTestId('promo-code-applied')).toBeVisible()

    await fillStripeTestCard(page, '4000000000000002')
    await page.getByTestId('payment-submit').click()

    await expect(page.getByTestId('payment-error')).toBeVisible()
    await expect(page.getByTestId('payment')).toBeVisible()
    await expect(page.getByTestId('promo-code-applied')).toContainText(code)
    await expect(page.getByTestId('payment-summary')).toContainText('27.00€')
  })

  test('the Apply button is disabled while the request runs', async ({ page, request }) => {
    const { id: gameId } = await createGameViaApi(request)
    const { code } = await createPromoCode(request)
    await signUpCustomer(page)
    await openPaymentWithGame(page, gameId)
    await page.route('**/api/orders/payment-intent/*/promo', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_000))
      await route.continue()
    })

    await applyPromoInUi(page, code)

    await expect(page.getByTestId('promo-code-apply')).toBeDisabled()
    await expect(page.getByTestId('promo-code-applied')).toBeVisible()
  })
})

test.describe('Feature 3: Admin promo codes page', () => {
  test.beforeEach(() => test.setTimeout(60_000))

  test('the admin nav has a Promo codes tab that opens the page', async ({ page }) => {
    await logInAsAdmin(page)
    await page.goto('/admin/games')

    await page.getByTestId('admin-nav-promo-codes').click()

    await expect(page).toHaveURL('/admin/promo-codes')
    await expect(page.getByTestId('promo-codes-table')).toBeVisible()
  })

  test('an admin creates a code and sees it with 0 uses', async ({ page }) => {
    const code = uniqueCode()
    await logInAsAdmin(page)
    await page.goto('/admin/promo-codes')

    const form = page.getByTestId('promo-code-form')
    await form.getByTestId('promo-code-input').fill(code)
    await form.getByTestId('promo-percent-input').fill('15')
    await form.getByTestId('promo-code-create').click()

    const row = page.getByTestId('promo-code-row').filter({ hasText: code })
    await expect(row).toBeVisible()
    await expect(row).toContainText('15%')
    await expect(row).toContainText('0')
    await expect(row.getByTestId('promo-code-status')).toHaveText('Active')
  })

  test('creating a code that exists shows the conflict message', async ({ page, request }) => {
    const { code } = await createPromoCode(request)
    await logInAsAdmin(page)
    await page.goto('/admin/promo-codes')

    const form = page.getByTestId('promo-code-form')
    await form.getByTestId('promo-code-input').fill(code)
    await form.getByTestId('promo-percent-input').fill('10')
    await form.getByTestId('promo-code-create').click()

    await expect(page.getByTestId('promo-form-error')).toBeVisible()
    await expect(page.getByTestId('promo-code-row').filter({ hasText: code })).toHaveCount(1)
  })

  test('an expired code and a used-up code show their labels', async ({ browser, page, request }) => {
    test.setTimeout(150_000)
    const { id: gameId } = await createGameViaApi(request)
    const expiring = await createPromoCode(request, {
      expiresAt: new Date(Date.now() + 3_000).toISOString(),
    })
    const usedUp = await createPromoCode(request, { maxUses: 1 })
    await buyWithCode(browser, gameId, usedUp.code)
    await new Promise((resolve) => setTimeout(resolve, 3_500))
    await logInAsAdmin(page)

    await page.goto('/admin/promo-codes')

    await expect(
      page.getByTestId('promo-code-row').filter({ hasText: expiring.code }).getByTestId('promo-code-status'),
    ).toHaveText('Expired')
    await expect(
      page.getByTestId('promo-code-row').filter({ hasText: usedUp.code }).getByTestId('promo-code-status'),
    ).toHaveText('Used up')
  })

  test('deleting needs the dialog, cancelling keeps the row, confirming removes it', async ({ page, request }) => {
    const { code } = await createPromoCode(request)
    await logInAsAdmin(page)
    await page.goto('/admin/promo-codes')
    const row = page.getByTestId('promo-code-row').filter({ hasText: code })

    await row.getByTestId('promo-code-delete').click()
    await page.getByTestId('admin-cancel-button').click()
    await expect(page.getByTestId('admin-confirm-dialog')).toHaveCount(0)
    await expect(row).toBeVisible()

    await row.getByTestId('promo-code-delete').click()
    await expect(page.getByTestId('admin-confirm-dialog')).toContainText(code)
    await page.getByTestId('admin-confirm-button').click()
    await expect(row).toHaveCount(0)
  })

  test('a regular user lands on / and a guest lands on /login', async ({ page, browser }) => {
    await signUpCustomer(page)
    await page.goto('/admin/promo-codes')
    await expect(page).toHaveURL('/')

    const guestContext = await browser.newContext()
    const guest = await guestContext.newPage()
    await guest.goto('/admin/promo-codes')
    await expect(guest).toHaveURL('/login')
    await guestContext.close()
  })
})
