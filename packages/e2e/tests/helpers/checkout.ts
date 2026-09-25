import { expect, Page } from '@playwright/test'

// Shared setup for the Payment and Game Activation TDD specs. See
// .claude/specs/features/cart/checkout-payment-activation-spec.md for the
// feature spec these two steps implement.

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
    await page.getByRole('button', { name: /add digital copy/i }).click()
  }

  return uniqueEmail
}

export async function goToPaymentStep(page: Page) {
  // Shopping Cart (step 1) is a drawer over the current page, not its own
  // route - open it from wherever the test already is instead of navigating.
  await page.getByTestId('cart-trigger').click()
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
  // Stripe preselects the billing country from the visitor's IP, and some
  // countries (the US, where CI runs) add a required postal code field. Pin
  // the country so the form is the same on every machine.
  await frame.locator('[name="country"]').selectOption('US')
  await frame.locator('[name="postalCode"]').fill('42424')
}

export async function completePayment(page: Page) {
  await fillStripeTestCard(page, '4242424242424242')
  await page.getByTestId('payment-submit').click()
  await expect(page.getByTestId('game-activation')).toBeVisible()
}

// Shared setup for the Physical Editions TDD spec. See
// .claude/specs/physical-editions-spec.md. Assumes the first seeded game
// (card index 0) has exactly two physical editions: an in-stock "Standard
// Physical Edition" and an out-of-stock "Collector's Edition".

export async function openFirstGameDetails(page: Page) {
  await page.goto('/')
  const card = page.getByTestId('card').first()
  await expect(card).toBeVisible()
  await card.click()
  await expect(page).toHaveURL(/\/game\/\d+/)
}

export async function addDigitalCopyToCart(page: Page) {
  await openFirstGameDetails(page)
  await page.getByRole('button', { name: /add digital copy/i }).click()
}

export async function addEditionToCart(page: Page, editionName: RegExp) {
  await openFirstGameDetails(page)
  await page.getByTestId('edition-option').filter({ hasText: editionName }).click()
}

export async function fillShippingAddress(
  page: Page,
  address: { name: string; line1: string; city: string; postalCode: string; country: string },
) {
  await page.getByTestId('shipping-name').fill(address.name)
  await page.getByTestId('shipping-line1').fill(address.line1)
  await page.getByTestId('shipping-city').fill(address.city)
  await page.getByTestId('shipping-postal-code').fill(address.postalCode)
  await page.getByTestId('shipping-country').fill(address.country)
}
