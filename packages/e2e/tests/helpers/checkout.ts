import { expect, Page } from '@playwright/test'

// Shared setup for the Payment and Game Activation TDD specs. See
// checkout-payment-activation-spec.md at the repo root for the feature spec
// these two steps implement.

export async function signUpAndAddGamesToCart(page: Page, count = 1) {
  const uniqueEmail = `e2e-checkout-${Date.now()}@dionis-store.test`

  await page.goto('/signup')
  await page.getByTestId('name').fill('E2E Checkout Player')
  await page.getByTestId('email').fill(uniqueEmail)
  await page.getByTestId('password').fill('password123')
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL('/')

  for (let i = 0; i < count; i++) {
    await page.goto('/')
    const card = page.getByTestId('card').nth(i)
    await expect(card).toBeVisible()
    await card.click()
    await expect(page).toHaveURL(/\/game\/\d+/)
    await page.getByRole('button', { name: /add to cart/i }).click()
  }
}

export async function goToPaymentStep(page: Page) {
  await page.goto('/cart')
  await page.getByRole('button', { name: 'Go to payment' }).click()
}

// Stripe mounts its Payment Element inside an iframe whose name is prefixed
// this way across Stripe.js versions.
export function stripeFrame(page: Page) {
  return page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
}

export async function fillStripeTestCard(page: Page, number: string, expiry = '12/34', cvc = '123') {
  // The Payment Element's payment-method picker (Card, Bancontact, EPS, ...)
  // renders inside the same Stripe iframe as the card fields, and Card needs
  // an explicit click before the card fields exist at all.
  const frame = stripeFrame(page)
  await frame.getByText('Card', { exact: true }).click()
  await frame.locator('[name="number"]').fill(number)
  await frame.locator('[name="expiry"]').fill(expiry)
  await frame.locator('[name="cvc"]').fill(cvc)
}

export async function completePayment(page: Page) {
  await fillStripeTestCard(page, '4242424242424242')
  await page.getByTestId('payment-submit').click()
  await expect(page.getByTestId('game-activation')).toBeVisible()
}
