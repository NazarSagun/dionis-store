import { expect, test } from '@playwright/test'

import { completePayment, goToPaymentStep, signUpAndAddGamesToCart } from './helpers/checkout'

// TDD spec for checkout-payment-activation-spec.md, Feature 2 (Game Activation
// step, Steam-style redemption). Every test below fails today for two
// reasons: this step does not exist, and the Payment step it walks through
// first (see payment.spec.ts) does not exist either. Design:
// https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=58-481

test.describe('Game Activation step', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndAddGamesToCart(page, 2)
    await goToPaymentStep(page)
    await completePayment(page)
  })

  test('lists every purchased game with its own code and redeem link, Finish starts disabled', async ({ page }) => {
    const rows = page.getByTestId('activation-row')
    await expect(rows).toHaveCount(2)

    for (const row of await rows.all()) {
      await expect(row.getByTestId('activation-code')).toBeVisible()
      await expect(row.getByTestId('activation-redeem-link')).toBeVisible()
      await expect(row.getByTestId('activation-mark-button')).toBeEnabled()
    }

    await expect(page.getByTestId('finish-button')).toBeDisabled()
  })

  test('marks a row activated when its button is clicked, Finish stays disabled', async ({ page }) => {
    const row = page.getByTestId('activation-row').first()

    await row.getByTestId('activation-mark-button').click()

    await expect(row.getByTestId('activation-status')).toHaveText(/activated/i)
    await expect(row.getByTestId('activation-mark-button')).toBeDisabled()
    await expect(page.getByTestId('finish-button')).toBeDisabled()
  })

  test('copies the exact displayed code to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const row = page.getByTestId('activation-row').first()
    const code = await row.getByTestId('activation-code').innerText()

    await row.getByTestId('activation-copy').click()

    const clipboardText = await page.evaluate(() => (globalThis as any).navigator.clipboard.readText())
    expect(clipboardText).toBe(code)
  })

  test('enables Finish once every row is activated', async ({ page }) => {
    const rows = page.getByTestId('activation-row')

    for (const row of await rows.all()) {
      await row.getByTestId('activation-mark-button').click()
      await expect(row.getByTestId('activation-status')).toHaveText(/activated/i)
    }

    await expect(page.getByTestId('finish-button')).toBeEnabled()
  })
})
