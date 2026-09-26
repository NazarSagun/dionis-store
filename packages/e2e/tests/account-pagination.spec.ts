import { expect, Page, test } from '@playwright/test'

import { completePayment, goToPaymentStep, signUpAndAddGamesToCart } from './helpers/checkout'

// TDD spec for roadmap-spec.md Feature 1.4: Library and Order History load
// orders one page at a time (5 per page) with a "Load more" button, and a
// game page checks ownership without loading every order.

const PAGE_SIZE = 5

async function buyGameAtIndex(page: Page, index: number) {
  await page.goto('/')
  const card = page.getByTestId('card').nth(index)
  await card.click()
  await expect(page).toHaveURL(/\/game\/\d+/)
  await page.getByRole('button', { name: /add digital copy/i }).click()
  await goToPaymentStep(page)
  await completePayment(page)
  await page.getByTestId('finish-button').click()
}

test.describe('Account order pagination', () => {
  // Six separate Stripe test payments, one more than a page.
  test.describe.configure({ timeout: 180_000 })

  test.beforeEach(async ({ page }) => {
    await signUpAndAddGamesToCart(page, 1)
    await goToPaymentStep(page)
    await completePayment(page)
    await page.getByTestId('finish-button').click()
    for (let index = 1; index <= PAGE_SIZE; index++) {
      await buyGameAtIndex(page, index)
    }
    await page.goto('/account')
  })

  test('Order History shows one page, then the rest after Load more', async ({ page }) => {
    await page.getByTestId('account-tab-order-history').click()
    const history = page.getByTestId('account-order-history')
    const rows = history.getByTestId('order-history-row')

    await expect(rows).toHaveCount(PAGE_SIZE)
    await history.getByRole('button', { name: 'Load more' }).click()

    await expect(rows).toHaveCount(PAGE_SIZE + 1)
    await expect(history.getByRole('button', { name: 'Load more' })).toHaveCount(0)
  })

  test('Library shows one page of orders, then the rest after Load more', async ({ page }) => {
    const library = page.getByTestId('account-library')
    const codes = library.getByTestId('activation-row')

    await expect(codes).toHaveCount(PAGE_SIZE)
    await library.getByRole('button', { name: 'Load more' }).click()

    await expect(codes).toHaveCount(PAGE_SIZE + 1)
    await expect(library.getByRole('button', { name: 'Load more' })).toHaveCount(0)
  })

  test('a game bought in the oldest order still shows as owned', async ({ page }) => {
    // Card 0 was the first purchase, so it is on the second page of orders.
    await page.goto('/')
    await page.getByTestId('card').nth(0).click()

    await expect(page.getByText('Already in Library')).toBeVisible()
  })
})
