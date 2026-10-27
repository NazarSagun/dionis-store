import { expect, test } from '@playwright/test'

import { apiToken, apiUrl, signUpCustomer } from './helpers/admin'
import { countReceiptsAfterDelay, waitForReceipts } from './helpers/mail'
import {
  alertedEditionIds,
  bearer,
  createGameWithEdition,
  editionAlertUrl,
  setStock,
  subscribe,
} from './helpers/restock'
import { getNotifications, logIn, PASSWORD, registerViaApi } from './helpers/reviews'

// TDD spec for .claude/specs/restock-alerts-spec.md. The stock alert model,
// its routes, the "Notify me" button, and the restock bell item do not exist
// yet, so these tests fail until phase 4.
// Design: Figma section "Game Details", the "Notify me" and restock panel
// frames, and the "Emails" section.
//
// Every test makes its own game and edition through the admin API, because a
// test raises or lowers stock and must not change the seeded games. A login
// replaces the account's one refresh token, so a user who is signed in in the
// browser never logs in to the API afterwards. API users are made with
// registerViaApi, and browser users with signUpCustomer.
test.describe.configure({ mode: 'default' })

const restockText = (title: string, edition: string) => `${title} (${edition}) is back in stock`

async function tokenFor(request: Parameters<typeof apiToken>[0], email: string) {
  return apiToken(request, email, PASSWORD)
}

test.describe('Feature 1: Restock alert API', () => {
  test('subscribing lists the edition, and a second subscribe keeps one alert', async ({ request }) => {
    const { gameId, editionId } = await createGameWithEdition(request)
    const token = await tokenFor(request, await registerViaApi(request))

    expect((await subscribe(request, token, editionId)).status()).toBe(204)
    expect((await subscribe(request, token, editionId)).status()).toBe(204)

    expect(await alertedEditionIds(request, token, gameId)).toEqual([editionId])
  })

  test('unsubscribing removes the edition and is safe to run twice', async ({ request }) => {
    const { gameId, editionId } = await createGameWithEdition(request)
    const token = await tokenFor(request, await registerViaApi(request))
    await subscribe(request, token, editionId)

    const first = await request.delete(editionAlertUrl(editionId), { headers: bearer(token) })
    const second = await request.delete(editionAlertUrl(editionId), { headers: bearer(token) })

    expect(first.status()).toBe(204)
    expect(second.status()).toBe(204)
    expect(await alertedEditionIds(request, token, gameId)).toEqual([])
  })

  test('the game detail response is public, shared, and shows the new stock after an admin raise', async ({
    request,
  }) => {
    const { gameId, editionId } = await createGameWithEdition(request)
    const token = await tokenFor(request, await registerViaApi(request))
    await subscribe(request, token, editionId)

    const asGuest = await request.get(`${apiUrl}/api/game/${gameId}`)
    const asUser = await request.get(`${apiUrl}/api/game/${gameId}`, { headers: bearer(token) })
    expect(await asUser.json()).toEqual(await asGuest.json())
    expect(asGuest.headers()['cache-control']).toContain('public')

    await setStock(request, editionId, 5)
    const after = await (await request.get(`${apiUrl}/api/game/${gameId}`)).json()
    expect(after.editions.find((e: { id: number }) => e.id === editionId).stock).toBe(5)
  })

  test('a raise from 0 sends one bell item and one email to each subscriber, and nothing to anyone else', async ({
    request,
  }) => {
    const { gameId, gameTitle, editionId, editionName } = await createGameWithEdition(request)
    const subscribed = await registerViaApi(request)
    const bystander = await registerViaApi(request)
    await subscribe(request, await tokenFor(request, subscribed), editionId)

    await setStock(request, editionId, 5)

    const [mail] = await waitForReceipts(request, subscribed)
    expect(mail.Subject).toBe(restockText(gameTitle, editionName))
    expect(mail.HTML).toContain(`/game/${gameId}`)
    expect(mail.Text).toContain(`/game/${gameId}`)
    expect(mail.Text).not.toMatch(/\b5\b/)

    const { notifications, unreadCount } = await getNotifications(request, subscribed)
    expect(unreadCount).toBe(1)
    expect(notifications[0]).toMatchObject({ type: 'restock', gameId, gameTitle, editionName })
    expect(JSON.stringify(notifications[0])).not.toContain(subscribed)

    expect((await getNotifications(request, bystander)).notifications).toHaveLength(0)
    expect(await countReceiptsAfterDelay(request, bystander)).toBe(0)
  })

  // The acceptance criterion "SMTP down, admin request still returns 200 and
  // the bell item exists" needs a mail server that fails on demand, which this
  // suite does not have. The API unit test of StockAlertsService covers it.
})

test.describe('Feature 2: "Notify me" on the game detail page', () => {
  test.beforeEach(() => test.setTimeout(60_000))

  test('an out-of-stock edition shows Notify me, and an in-stock edition does not', async ({ page, request }) => {
    const soldOut = await createGameWithEdition(request)
    const inStock = await createGameWithEdition(request, 5)
    await signUpCustomer(page)

    await page.goto(`/game/${soldOut.gameId}`)
    await expect(page.getByTestId('edition-stock')).toHaveText(/out of stock/i)
    await expect(page.getByTestId('edition-notify')).toHaveText('Notify me')
    // The sold-out tile has no way to add the edition to the cart.
    await expect(page.getByRole('button', { name: new RegExp(soldOut.editionName) })).toHaveCount(0)

    await page.goto(`/game/${inStock.gameId}`)
    await expect(page.getByTestId('edition-option').filter({ hasText: inStock.editionName })).toBeEnabled()
    await expect(page.getByTestId('edition-notify')).toHaveCount(0)
  })

  test('Notify me turns into Notifying you, survives a reload, and turns back', async ({ page, request }) => {
    const { gameId } = await createGameWithEdition(request)
    await signUpCustomer(page)
    await page.goto(`/game/${gameId}`)
    const button = page.getByTestId('edition-notify')

    await button.click()
    await expect(button).toHaveText('Notifying you')

    await page.reload()
    await expect(page.getByTestId('edition-notify')).toHaveText('Notifying you')

    await page.getByTestId('edition-notify').click()
    await expect(page.getByTestId('edition-notify')).toHaveText('Notify me')

    await page.reload()
    await expect(page.getByTestId('edition-notify')).toHaveText('Notify me')
  })

  test('a guest who clicks Notify me lands on the login page and returns to the game after login', async ({
    page,
    request,
  }) => {
    const { gameId } = await createGameWithEdition(request)
    const email = await registerViaApi(request)

    await page.goto(`/game/${gameId}`)
    await page.getByTestId('edition-notify').click()
    await expect(page).toHaveURL(/\/login/)

    await page.getByTestId('email').fill(email)
    await page.getByTestId('password').fill(PASSWORD)
    await page.getByTestId('submit-button').click()
    await expect(page).toHaveURL(`/game/${gameId}`)
  })

})

test.describe('Feature 3: Restock item in the bell', () => {
  test.beforeEach(() => test.setTimeout(60_000))

  test('the bell shows the restock item, a click opens the game and removes the item', async ({ page, request }) => {
    const { gameId, gameTitle, editionId, editionName } = await createGameWithEdition(request)
    const email = await registerViaApi(request)
    await subscribe(request, await tokenFor(request, email), editionId)
    await setStock(request, editionId, 5)
    await logIn(page, email)

    await expect(page.getByTestId('notification-count')).toHaveText('1')
    await page.getByTestId('notification-bell').click()
    const item = page.getByTestId('notification-item')
    await expect(item).toHaveCount(1)
    await expect(item).toContainText(restockText(gameTitle, editionName))

    await item.getByTestId('notification-link').click()
    await expect(page).toHaveURL(`/game/${gameId}`)

    await page.getByTestId('notification-bell').click()
    await expect(page.getByTestId('notification-item')).toHaveCount(0)
    await expect(page.getByTestId('notification-count')).toHaveCount(0)
  })

})
