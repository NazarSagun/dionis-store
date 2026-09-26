import { expect, Page, test } from '@playwright/test'

import {
  apiToken,
  apiUrl,
  createGameViaApi,
  highestGameId,
  logInAsAdmin,
  logOut,
  newGameFields,
  openAdminGame,
  signUpCustomer,
  uniqueSuffix,
} from './helpers/admin'
import { completePayment, goToPaymentStep } from './helpers/checkout'

// TDD spec for .claude/specs/app/admin-panel-spec.md. The /admin pages and
// the admin API routes do not exist yet, so these tests fail until phase 4.
// Design: Figma section "Admin Panel (proposal)", node 233-195.
//
// A login replaces the account's one refresh token (User.refreshToken), so an
// API login as the admin ends the browser's admin session on its next page
// load. Each test therefore creates its data through the API before logging
// the browser in, and the file runs in one worker, in order, so tests cannot end each other's
// admin sessions.
test.describe.configure({ mode: 'default' })

async function buyDigitalCopy(page: Page, title: string) {
  await page.goto(`/?search=${encodeURIComponent(title)}`)
  await page.getByTestId('game-library').getByTestId('card').first().click()
  await expect(page).toHaveURL(/\/game\/\d+/)
  await page.getByRole('button', { name: /add digital copy/i }).click()
  await goToPaymentStep(page)
  await completePayment(page)
  await page.getByTestId('finish-button').click()
}

const gameRows = (page: Page) => page.getByTestId('admin-games-table').getByTestId('admin-game-row')

test.describe('Feature 1: Admin access', () => {
  test('an admin sees "Admin" in the account menu and it opens /admin/games', async ({ page }) => {
    await logInAsAdmin(page)
    await page.getByTestId('account-menu-trigger').click()
    await page.getByTestId('account-menu-admin').click()

    await expect(page).toHaveURL('/admin/games')
    await expect(page.getByTestId('admin-nav')).toBeVisible()
  })

  test('a regular user sees no "Admin" item', async ({ page }) => {
    await signUpCustomer(page)
    await page.getByTestId('account-menu-trigger').click()

    await expect(page.getByRole('menuitem', { name: 'Logout' })).toBeVisible()
    await expect(page.getByTestId('account-menu-admin')).toHaveCount(0)
  })

  test('a regular user who opens /admin/games lands on /', async ({ page }) => {
    await signUpCustomer(page)
    await page.goto('/admin/games')

    await expect(page).toHaveURL('/')
  })

  test('a guest who opens /admin/orders lands on /login', async ({ page }) => {
    await page.goto('/admin/orders')

    await expect(page).toHaveURL('/login')
  })

  test('the admin orders API rejects a regular user with 403 and no token with 401', async ({ page, request }) => {
    const email = await signUpCustomer(page)
    const token = await apiToken(request, email, 'password123')

    const asUser = await request.get(`${apiUrl}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
    const asGuest = await request.get(`${apiUrl}/api/admin/orders`)

    expect(asUser.status()).toBe(403)
    expect(asGuest.status()).toBe(401)
  })
})

test.describe('Feature 2: Games list', () => {
  test.beforeEach(async ({ page }) => {
    await logInAsAdmin(page)
    await page.goto('/admin/games')
  })

  test('shows 20 games, starting with the lowest id', async ({ page, request }) => {
    const { games } = await (await request.get(`${apiUrl}/api/games/1`)).json()

    await expect(gameRows(page)).toHaveCount(20)
    await expect(gameRows(page).first()).toContainText(games[0].title)
  })

  test('the search box keeps only games whose title contains the text', async ({ page, request }) => {
    const { games } = await (await request.get(`${apiUrl}/api/games/1`)).json()
    const fragment = games[0].title.slice(0, 5)

    const { games: matching } = await (
      await request.get(`${apiUrl}/api/games/1?search=${encodeURIComponent(fragment)}`)
    ).json()

    await page.getByTestId('admin-games-search').fill(fragment)

    // Wait for the filtered page to replace the unfiltered one before reading rows.
    await expect(gameRows(page)).toHaveCount(matching.length)
    for (const row of await gameRows(page).all()) {
      await expect(row).toContainText(fragment, { ignoreCase: true })
    }
  })

  test('clicking a row opens that game', async ({ page, request }) => {
    const { games } = await (await request.get(`${apiUrl}/api/games/1`)).json()

    await gameRows(page).first().click()

    await expect(page).toHaveURL(`/admin/games/${games[0].id}`)
  })
})

test.describe('Feature 3: Create and edit a game', () => {
  test('creating a game assigns an id above every existing one', async ({ page, request }) => {
    const before = await highestGameId(request)
    await logInAsAdmin(page)
    await page.goto('/admin/games')
    await page.getByTestId('admin-game-new').click()
    await expect(page).toHaveURL('/admin/games/new')

    for (const [label, value] of Object.entries(newGameFields(`E2E New Game ${uniqueSuffix()}`))) {
      await page.getByTestId('admin-game-form').getByLabel(label, { exact: true }).fill(value)
    }
    await page.getByTestId('admin-game-save').click()

    await expect(page).toHaveURL(/\/admin\/games\/\d+$/)
    const id = Number(page.url().split('/').pop())
    expect(id).toBeGreaterThan(before)
    await expect(page.getByText('Game created', { exact: true })).toBeVisible()
  })

  test('a duplicate title shows the API message and does not navigate', async ({ page, request }) => {
    const existing = await createGameViaApi(request)
    await logInAsAdmin(page)
    await page.goto('/admin/games/new')

    for (const [label, value] of Object.entries(newGameFields(existing.title))) {
      await page.getByTestId('admin-game-form').getByLabel(label, { exact: true }).fill(value)
    }
    await page.getByTestId('admin-game-save').click()

    await expect(page.getByTestId('admin-form-error')).toHaveText(/A game with this id or title already exists/)
    await expect(page).toHaveURL('/admin/games/new')
  })

  test('changing the discount shows on the storefront', async ({ page, request }) => {
    const game = await createGameViaApi(request)
    await logInAsAdmin(page)
    await openAdminGame(page, game.id)

    await page.getByTestId('admin-game-form').getByLabel('Discount (%)', { exact: true }).fill('40')
    await page.getByTestId('admin-game-save').click()
    await expect(page.getByText('Game saved', { exact: true })).toBeVisible()

    await page.goto(`/game/${game.id}`)
    await expect(page.getByText('-40%')).toBeVisible()
  })

  test('a discount above 100 shows an error and does not save', async ({ page, request }) => {
    const game = await createGameViaApi(request)
    await logInAsAdmin(page)
    await openAdminGame(page, game.id)

    await page.getByTestId('admin-game-form').getByLabel('Discount (%)', { exact: true }).fill('150')
    await page.getByTestId('admin-game-save').click()

    await expect(page.getByTestId('admin-form-error')).toBeVisible()
    const stored = await (await request.get(`${apiUrl}/api/game/${game.id}`)).json()
    expect(stored.discount).toBe(0)
  })
})

test.describe('Feature 4: Delete a game', () => {
  test('deleting a game nobody bought removes it', async ({ page, request }) => {
    const game = await createGameViaApi(request)
    await logInAsAdmin(page)
    await openAdminGame(page, game.id)

    await page.getByTestId('admin-game-delete').click()
    await expect(page.getByTestId('admin-confirm-dialog')).toContainText(game.title)
    await page.getByTestId('admin-confirm-button').click()

    await expect(page).toHaveURL('/admin/games')
    await expect(page.getByText('Game deleted', { exact: true })).toBeVisible()
    await page.getByTestId('admin-games-search').fill(game.title)
    await expect(gameRows(page)).toHaveCount(0)
  })

  test('a game in an order cannot be deleted', async ({ page, request }) => {
    test.setTimeout(90_000)
    const game = await createGameViaApi(request)
    await signUpCustomer(page)
    await buyDigitalCopy(page, game.title)
    await logOut(page)

    await logInAsAdmin(page)
    await openAdminGame(page, game.id)
    await page.getByTestId('admin-game-delete').click()
    await page.getByTestId('admin-confirm-button').click()

    await expect(page.getByText('This game is in 1 order and cannot be deleted.')).toBeVisible()
    expect((await request.get(`${apiUrl}/api/game/${game.id}`)).ok()).toBe(true)
  })

  test('cancelling the dialog deletes nothing', async ({ page, request }) => {
    const game = await createGameViaApi(request)
    await logInAsAdmin(page)
    await openAdminGame(page, game.id)

    await page.getByTestId('admin-game-delete').click()
    await page.getByTestId('admin-cancel-button').click()

    await expect(page.getByTestId('admin-confirm-dialog')).toHaveCount(0)
    expect((await request.get(`${apiUrl}/api/game/${game.id}`)).ok()).toBe(true)
  })
})

test.describe('Feature 5: Editions', () => {
  test('an admin adds, restocks, and deletes an edition, and the storefront follows', async ({ page, request }) => {
    const game = await createGameViaApi(request)
    await logInAsAdmin(page)
    await openAdminGame(page, game.id)
    const editions = page.getByTestId('admin-editions')

    // Add
    await editions.getByTestId('admin-edition-add').click()
    const form = editions.getByTestId('admin-edition-form')
    await form.getByLabel('Name', { exact: true }).fill('Deluxe Edition')
    await form.getByLabel('Price (€)', { exact: true }).fill('45')
    await form.getByLabel('Discount (%)', { exact: true }).fill('0')
    await form.getByLabel('Stock', { exact: true }).fill('3')
    await form.getByLabel('Description', { exact: true }).fill('Disc, soundtrack, and a map.')
    await form.getByTestId('admin-edition-save').click()
    await expect(editions.getByTestId('admin-edition-row')).toHaveCount(1)
    await expect(editions.getByTestId('admin-edition-row')).toContainText('Deluxe Edition')

    await page.goto(`/game/${game.id}`)
    const deluxe = page.getByTestId('edition-option').filter({ hasText: 'Deluxe Edition' })
    await expect(deluxe).toBeEnabled()

    // Restock to 0
    await openAdminGame(page, game.id)
    await editions.getByTestId('admin-edition-edit').click()
    await editions.getByTestId('admin-edition-form').getByLabel('Stock', { exact: true }).fill('0')
    await editions.getByTestId('admin-edition-form').getByTestId('admin-edition-save').click()
    await expect(editions.getByTestId('admin-edition-row')).toContainText('Out of stock')

    await page.goto(`/game/${game.id}`)
    await expect(deluxe).toBeDisabled()
    await expect(deluxe.getByTestId('edition-stock')).toHaveText(/out of stock/i)

    // Delete
    await openAdminGame(page, game.id)
    await editions.getByTestId('admin-edition-delete').click()
    await page.getByTestId('admin-confirm-button').click()
    await expect(editions.getByTestId('admin-edition-row')).toHaveCount(0)
  })
})

test.describe('Feature 6: Orders', () => {
  test('an admin sees a new order first, finds it by email, and expands it', async ({ page, request }) => {
    test.setTimeout(90_000)
    const game = await createGameViaApi(request)
    const email = await signUpCustomer(page)
    await buyDigitalCopy(page, game.title)
    await logOut(page)

    await logInAsAdmin(page)
    await page.goto('/admin/orders')
    const rows = page.getByTestId('admin-orders-table').getByTestId('admin-order-row')
    await expect(rows.first()).toContainText(email)
    await expect(rows.first()).toContainText('€30.00')

    await page.getByTestId('admin-orders-search').fill(email)
    await expect(rows).toHaveCount(1)

    await rows.first().getByTestId('admin-order-toggle').click()
    const items = page.getByTestId('admin-order-items')
    await expect(items).toContainText(game.title)
    await expect(items).toContainText('Digital')
  })
})
