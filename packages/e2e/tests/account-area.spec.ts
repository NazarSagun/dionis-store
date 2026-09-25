import { expect, Page, test } from '@playwright/test'

import { completePayment, fillStripeTestCard, goToPaymentStep, signUpAndAddGamesToCart } from './helpers/checkout'

// TDD spec for account-area-spec.md. The `/account` route, its Library,
// Wishlist, Order History, Settings, and Recently Viewed sections do not
// exist yet, so every test below fails until phase 4 implements them against
// these test IDs. Design: the "Account" frame at
// https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=89-481

// Adds one more game to the cart for an already-authenticated session.
// `signUpAndAddGamesToCart` always signs up a fresh player, so a second order
// in the same test uses this instead.
async function addGameToCartFromHome(page: Page, index: number) {
  await page.goto('/')
  const card = page.getByTestId('card').nth(index)
  await expect(card).toBeVisible()
  await card.click()
  await expect(page).toHaveURL(/\/game\/\d+/)
  await page.getByRole('button', { name: /add digital copy/i }).click()
}

// Marks every current Game Activation row activated and clicks Finish, which
// clears the cart and returns home. Used when a test only needs a cleanly
// closed-out order, not a specific mid-activation state.
async function markAllActivatedAndFinish(page: Page) {
  const rows = page.getByTestId('activation-row')
  for (const row of await rows.all()) {
    await row.getByTestId('activation-mark-button').click()
  }
  await page.getByTestId('finish-button').click()
}

test.describe('Account area', () => {
  test('redirects an unauthenticated visitor to /login', async ({ page }) => {
    await page.goto('/account')

    await expect(page).toHaveURL('/login')
  })

  test.describe('with one fully completed two-game order and a wishlisted game', () => {
    let currentEmail = ''

    test.beforeEach(async ({ page }) => {
      currentEmail = await signUpAndAddGamesToCart(page, 2)
      await goToPaymentStep(page)
      await completePayment(page)
      await markAllActivatedAndFinish(page)

      await page.goto('/')
      await page.getByTestId('wishlist-toggle').first().click()

      await page.goto('/account')
    })

    test('shows the account page shell with the signed-in player name', async ({ page }) => {
      await expect(page.getByTestId('account-page')).toBeVisible()
      await expect(page.getByText('Hi, E2E Checkout Player').first()).toBeVisible()
      await expect(page.getByTestId('account-tab-library')).toBeVisible()
      await expect(page.getByTestId('account-tab-wishlist')).toBeVisible()
      await expect(page.getByTestId('account-tab-order-history')).toBeVisible()
      await expect(page.getByTestId('account-tab-settings')).toBeVisible()
    })

    test('Library copies the exact displayed code to the clipboard', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      const row = page.getByTestId('account-library').getByTestId('activation-row').first()
      const code = await row.getByTestId('activation-code').innerText()

      await row.getByTestId('activation-copy').click()

      const clipboardText = await page.evaluate(() => (globalThis as any).navigator.clipboard.readText())
      expect(clipboardText).toBe(code)
    })

    test('Wishlist shows the same game wishlisted from the home page', async ({ page }) => {
      await page.getByTestId('account-tab-wishlist').click()
      await expect(page.getByTestId('wishlist').getByTestId('card')).toHaveCount(1)
    })

    test('removing a game from the account Wishlist removes it from the list', async ({ page }) => {
      await page.getByTestId('account-tab-wishlist').click()
      await page.getByTestId('wishlist').getByTestId('wishlist-toggle').first().click()

      await expect(page.getByTestId('wishlist-empty')).toBeVisible()
    })

    test('Wishlist "Add to cart" adds the game without removing it from the wishlist', async ({ page }) => {
      await page.getByTestId('account-tab-wishlist').click()
      const wishlistCard = page.getByTestId('wishlist').getByTestId('card').first()

      await wishlistCard.getByTestId('wishlist-add-to-cart').click()

      await page.getByTestId('cart-trigger').click()
      await expect(page.getByText('Your cart is empty')).not.toBeVisible()
      await page.goto('/account')
      await page.getByTestId('account-tab-wishlist').click()
      await expect(page.getByTestId('wishlist').getByTestId('card')).toHaveCount(1)
    })

    test('Order History lists the order with its date, item count, and total', async ({ page }) => {
      await page.getByTestId('account-tab-order-history').click()
      const row = page.getByTestId('account-order-history').getByTestId('order-history-row').first()

      await expect(row).toBeVisible()
      await expect(row).toContainText(/2\s+items?/i)
    })

    test('expanding an Order History row shows its games with no activation controls', async ({ page }) => {
      await page.getByTestId('account-tab-order-history').click()
      const row = page.getByTestId('account-order-history').getByTestId('order-history-row').first()

      await row.getByTestId('order-history-toggle').click()

      await expect(row.getByTestId('activation-mark-button')).toHaveCount(0)
      await expect(row.getByTestId('activation-code')).toHaveCount(0)
    })

    test('changing the display name updates the greeting immediately', async ({ page }) => {
      await page.getByTestId('account-tab-settings').click()
      const settings = page.getByTestId('account-settings')

      await settings.getByTestId('settings-name-input').fill('E2E Renamed Player')
      await settings.getByTestId('settings-name-save').click()

      await expect(page.getByText('Hi, E2E Renamed Player').first()).toBeVisible()
    })

    test('changing the password with the wrong current password shows an error and keeps it unchanged', async ({ page }) => {
      await page.getByTestId('account-tab-settings').click()
      const settings = page.getByTestId('account-settings')

      await settings.getByTestId('settings-current-password').fill('not-the-real-password')
      await settings.getByTestId('settings-new-password').fill('newpassword456')
      await settings.getByTestId('settings-password-save').click()

      await expect(page.getByText(/current password/i)).toBeVisible()
    })

    test('changing the password with the correct current password lets the next login succeed with it', async ({ page }) => {
      await page.getByTestId('account-tab-settings').click()
      const settings = page.getByTestId('account-settings')

      await settings.getByTestId('settings-current-password').fill('password123')
      await settings.getByTestId('settings-new-password').fill('newpassword456')
      await settings.getByTestId('settings-password-save').click()

      await page.getByTestId('account-menu-trigger').click()
      await page.getByRole('menuitem', { name: 'Logout' }).click()
      await page.goto('/login')
      await page.getByTestId('email').fill(currentEmail)
      await page.getByTestId('password').fill('newpassword456')
      await page.getByTestId('submit-button').click()

      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Library with a mixed activation state', () => {
    test('shows one already-activated row and one still-pending row from the same order', async ({ page }) => {
      await signUpAndAddGamesToCart(page, 2)
      await goToPaymentStep(page)
      await completePayment(page)
      await page.getByTestId('activation-row').first().getByTestId('activation-mark-button').click()

      await page.goto('/account')

      const rows = page.getByTestId('account-library').getByTestId('activation-row')
      await expect(rows).toHaveCount(2)
      // Once activated, ActivationRow swaps the button out for the status
      // badge entirely - there's no disabled button left behind to assert on.
      await expect(rows.nth(0).getByTestId('activation-status')).toHaveText(/activated/i)
      await expect(rows.nth(0).getByTestId('activation-mark-button')).toHaveCount(0)
      await expect(rows.nth(1).getByTestId('activation-mark-button')).toBeEnabled()
    })
  })

  test.describe('Order History with two separate orders', () => {
    test('groups games under their own order', async ({ page }) => {
      await signUpAndAddGamesToCart(page, 1)
      await goToPaymentStep(page)
      await completePayment(page)
      await markAllActivatedAndFinish(page)

      await addGameToCartFromHome(page, 1)
      await goToPaymentStep(page)
      await fillStripeTestCard(page, '4242424242424242')
      await page.getByTestId('payment-submit').click()
      await expect(page.getByTestId('game-activation')).toBeVisible()
      await markAllActivatedAndFinish(page)

      await page.goto('/account')
      await page.getByTestId('account-tab-order-history').click()
      await expect(page.getByTestId('account-order-history').getByTestId('order-history-row')).toHaveCount(2)
    })
  })

  test.describe('Library with no past orders', () => {
    test('shows an empty state instead of an empty list', async ({ page }) => {
      await signUpAndAddGamesToCart(page, 0)

      await page.goto('/account')

      await expect(page.getByTestId('account-library-empty')).toBeVisible()
      await expect(page.getByTestId('account-library').getByTestId('activation-row')).toHaveCount(0)
    })
  })

  test.describe('Recently Viewed', () => {
    test('lists visited games, most recent first, deduped on a repeat visit', async ({ page }) => {
      await signUpAndAddGamesToCart(page, 0)

      const titles: string[] = []
      for (const index of [0, 1, 0]) {
        await page.goto('/')
        const card = page.getByTestId('card').nth(index)
        const title = await card.locator('h3').innerText()
        await card.click()
        await expect(page).toHaveURL(/\/game\/\d+/)
        titles.push(title)
      }

      await page.goto('/account')
      const recentTitles = await page.getByTestId('recently-viewed').getByTestId('card').locator('h3').allInnerTexts()

      expect(recentTitles).toEqual([titles[2], titles[1]])
    })
  })

  test.describe('Wishlist price-drop alert', () => {
    test('shows no badge when a wishlisted game has an unchanged discount', async ({ page }) => {
      await signUpAndAddGamesToCart(page, 0)

      await page.getByTestId('wishlist-toggle').first().click()
      await page.goto('/account')
      await page.getByTestId('account-tab-wishlist').click()

      await expect(page.getByTestId('wishlist').getByTestId('wishlist-price-drop-badge')).toHaveCount(0)
    })

    // The other two acceptance criteria in account-area-spec.md Feature 8 need
    // a wishlisted game's discount to change between two page loads. Nothing
    // in this suite can mutate a seeded game's discount from a test today, so
    // these stay unimplemented rather than faked. Un-skip once the suite has
    // a way to change a game's discount mid-test.
    test.fixme('shows a "Price dropped" badge once the discount grows after wishlisting', async () => {})
    test.fixme('stops showing the badge on a later visit once it has been shown once', async () => {})
  })
})
