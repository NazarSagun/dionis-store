import { expect, test } from '@playwright/test'

import { completePayment, goToPaymentStep, signUpAndAddGamesToCart } from './helpers/checkout'

// Spec for checkout-payment-activation-spec.md, Feature 2 (Game Activation
// step, Steam-style redemption). Design:
// https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=58-481
//
// The written spec's Feature 2 requirement 5 says Finish stays disabled
// until every row is activated. The shipped app deliberately does not do
// this - see GameActivation.test.tsx's "Finish must never force it" comment
// - so a user can finish now and activate later from their account (the
// account-area-spec.md Library section). These tests assert the shipped
// behavior, not the original written requirement.

test.describe('Game Activation step', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndAddGamesToCart(page, 2)
    await goToPaymentStep(page)
    await completePayment(page)
  })

  test('lists every purchased game with its own code and redeem link, Finish starts enabled', async ({ page }) => {
    const rows = page.getByTestId('activation-row')
    await expect(rows).toHaveCount(2)

    for (const row of await rows.all()) {
      await expect(row.getByTestId('activation-code')).toBeVisible()
      await expect(row.getByTestId('activation-redeem-link')).toBeVisible()
      await expect(row.getByTestId('activation-mark-button')).toBeEnabled()
    }

    // Activation happens on Steam, outside this store - Finish must never
    // force it. See GameActivation.test.tsx for the same rule at unit level.
    await expect(page.getByTestId('finish-button')).toBeEnabled()
  })

  test('marks a row activated when its button is clicked', async ({ page }) => {
    const row = page.getByTestId('activation-row').first()

    await row.getByTestId('activation-mark-button').click()

    await expect(row.getByTestId('activation-status')).toHaveText(/activated/i)
    // The button is replaced by the status badge once activated, not left
    // behind disabled.
    await expect(row.getByTestId('activation-mark-button')).toHaveCount(0)
  })

  test('copies the exact displayed code to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const row = page.getByTestId('activation-row').first()
    const code = await row.getByTestId('activation-code').innerText()

    await row.getByTestId('activation-copy').click()

    const clipboardText = await page.evaluate(() => (globalThis as any).navigator.clipboard.readText())
    expect(clipboardText).toBe(code)
  })

  test('marking every row activated leaves Finish enabled', async ({ page }) => {
    const rows = page.getByTestId('activation-row')

    for (const row of await rows.all()) {
      await row.getByTestId('activation-mark-button').click()
      await expect(row.getByTestId('activation-status')).toHaveText(/activated/i)
    }

    await expect(page.getByTestId('finish-button')).toBeEnabled()
  })
})
