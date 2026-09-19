import { expect, test } from '@playwright/test'

import { fillStripeTestCard, goToPaymentStep, signUpAndAddGamesToCart, stripeFrame } from './helpers/checkout'

// TDD spec for checkout-payment-activation-spec.md, Feature 1 (Payment step).
// `Payment.tsx` is a static stub today and mounts no Stripe element, so every
// test below fails until the step is implemented against these test IDs and
// against Stripe's own iframe. Design:
// https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=58-481

test.describe('Payment step', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndAddGamesToCart(page, 1)
    await goToPaymentStep(page)
  })

  test('shows an order summary and mounts the Stripe payment element', async ({ page }) => {
    await expect(page.getByTestId('payment')).toBeVisible()
    await expect(page.getByTestId('payment-summary')).toBeVisible()
    await expect(stripeFrame(page).getByText('Card', { exact: true })).toBeVisible()
  })

  test('advances to the Game Activation step on a successful test payment', async ({ page }) => {
    await fillStripeTestCard(page, '4242424242424242')

    await page.getByTestId('payment-submit').click()

    await expect(page.getByTestId('game-activation')).toBeVisible()
  })

  test('shows an error and stays on step 2 for a declined test card', async ({ page }) => {
    await fillStripeTestCard(page, '4000000000000002')

    await page.getByTestId('payment-submit').click()

    await expect(page.getByTestId('payment-error')).toBeVisible()
    await expect(page.getByTestId('payment')).toBeVisible()
  })
})
