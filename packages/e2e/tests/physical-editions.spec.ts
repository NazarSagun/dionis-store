import { expect, test } from '@playwright/test'

import {
  addDigitalCopyToCart,
  addEditionToCart,
  completePayment,
  fillShippingAddress,
  fillStripeTestCard,
  goToPaymentStep,
  openFirstGameDetails,
  signUpAndAddGamesToCart,
} from './helpers/checkout'

// TDD spec for physical-editions-spec.md, encoding Feature 1-6's acceptance
// criteria against `GameDetails.tsx`'s "Add Digital Copy" and edition
// buttons, `Payment.tsx`'s shipping form, and `GameActivation.tsx`'s
// shipping rows.
// Design: https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=101-693
//
// Fixture assumption: the first seeded game (card index 0, the one
// `openFirstGameDetails` opens) has exactly two physical editions - an
// in-stock "Standard Physical Edition" and an out-of-stock "Collector's
// Edition" - each seeded per physical-editions-spec.md's Feature 1
// "Out of scope" note (editions are seeded, not created from the storefront).

test.describe('Game detail page purchase options', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndAddGamesToCart(page, 0)
  })

  test('sizes the digital button the same as an edition button, neither reading as the default', async ({
    page,
  }) => {
    await openFirstGameDetails(page)

    const digitalButton = page.getByRole('button', { name: /add digital copy/i })
    const standardButton = page.getByTestId('edition-option').filter({ hasText: /standard/i })
    await expect(digitalButton).toBeVisible()
    await expect(standardButton).toBeVisible()

    const digitalBox = await digitalButton.boundingBox()
    const standardBox = await standardButton.boundingBox()
    expect(digitalBox).not.toBeNull()
    expect(standardBox).not.toBeNull()
    expect(Math.abs((digitalBox?.width ?? 0) - (standardBox?.width ?? 0))).toBeLessThan(4)
    expect(Math.abs((digitalBox?.height ?? 0) - (standardBox?.height ?? 0))).toBeLessThan(4)
  })

  test('disables an out-of-stock edition and labels it Out of stock', async ({ page }) => {
    await openFirstGameDetails(page)

    const collectorsButton = page.getByTestId('edition-option').filter({ hasText: /collector/i })
    await expect(collectorsButton).toBeDisabled()
    await expect(collectorsButton.getByTestId('edition-stock')).toHaveText(/out of stock/i)
  })

  test('shows each edition description under the game description', async ({ page }) => {
    await openFirstGameDetails(page)

    const descriptions = page.getByTestId('edition-description')
    await expect(descriptions.filter({ hasText: /standard/i })).toBeVisible()

    const collectorsDescription = descriptions.filter({ hasText: /collector/i })
    await expect(collectorsDescription).toBeVisible()
    await expect(collectorsDescription).not.toHaveText(/^collector.?s edition$/i)
  })
})

test.describe('Cart support for editions', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndAddGamesToCart(page, 0)
    await addDigitalCopyToCart(page)
    await addEditionToCart(page, /standard/i)
  })

  test('keeps the digital line and the physical edition line separate for the same game', async ({ page }) => {
    await page.getByTestId('cart-trigger').click()

    const rows = page.getByTestId('cart-item')
    await expect(rows).toHaveCount(2)

    const physicalRow = rows.filter({ has: page.getByTestId('cart-item-edition') })
    const digitalRow = rows.filter({ hasNot: page.getByTestId('cart-item-edition') })
    await expect(physicalRow).toHaveCount(1)
    await expect(digitalRow).toHaveCount(1)
    await expect(physicalRow.getByTestId('cart-item-edition')).toHaveText(/standard/i)
  })

  test('removing the physical line leaves the digital line untouched', async ({ page }) => {
    await page.getByTestId('cart-trigger').click()
    const physicalRow = page.getByTestId('cart-item').filter({ has: page.getByTestId('cart-item-edition') })

    await physicalRow.getByRole('button').filter({ has: page.locator('img[alt="delete item"]') }).click()

    await expect(page.getByTestId('cart-item')).toHaveCount(1)
    await expect(page.getByTestId('cart-item-edition')).toHaveCount(0)
  })

  test('increasing the physical line quantity does not change the digital line quantity', async ({ page }) => {
    await page.getByTestId('cart-trigger').click()
    const physicalRow = page.getByTestId('cart-item').filter({ has: page.getByTestId('cart-item-edition') })
    const digitalRow = page.getByTestId('cart-item').filter({ hasNot: page.getByTestId('cart-item-edition') })

    await physicalRow.getByTestId('select').click()
    await page.getByTestId('option-2').click()

    await expect(physicalRow.getByTestId('select')).toHaveText('2')
    await expect(digitalRow.getByTestId('select')).toHaveText('1')
  })
})

test.describe('Shipping address at checkout', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndAddGamesToCart(page, 0)
  })

  test('a digital-only cart reaches Payment with no shipping address form', async ({ page }) => {
    await addDigitalCopyToCart(page)

    await goToPaymentStep(page)

    await expect(page.getByTestId('payment')).toBeVisible()
    await expect(page.getByTestId('shipping-address-form')).toHaveCount(0)
  })

  test('a cart with a physical item shows the shipping address form', async ({ page }) => {
    await addEditionToCart(page, /standard/i)

    await goToPaymentStep(page)

    await expect(page.getByTestId('shipping-address-form')).toBeVisible()
  })

  test('submitting with a required field empty shows a validation error and does not advance', async ({ page }) => {
    await addEditionToCart(page, /standard/i)
    await goToPaymentStep(page)

    await fillShippingAddress(page, {
      name: 'Alex Doe',
      line1: '',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Germany',
    })
    await fillStripeTestCard(page, '4242424242424242')
    await page.getByTestId('payment-submit').click()

    await expect(page.getByTestId('shipping-address-error')).toBeVisible()
    await expect(page.getByTestId('payment')).toBeVisible()
    await expect(page.getByTestId('game-activation')).toHaveCount(0)
  })
})

test.describe('Delivery fee', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndAddGamesToCart(page, 0)
  })

  test('a digital-only cart shows no Shipping line', async ({ page }) => {
    await addDigitalCopyToCart(page)

    await goToPaymentStep(page)

    await expect(page.getByTestId('shipping-fee')).toHaveCount(0)
  })

  test('a cart with a physical item shows a Shipping line included in the total', async ({ page }) => {
    await addEditionToCart(page, /standard/i)

    await goToPaymentStep(page)

    await expect(page.getByTestId('shipping-fee')).toBeVisible()
  })
})

test.describe('Game Activation step for mixed orders', () => {
  test('shows a coded row for the digital item and a shipping-note row for the physical item, Finish enabled immediately', async ({
    page,
  }) => {
    await signUpAndAddGamesToCart(page, 0)
    await addDigitalCopyToCart(page)
    await addEditionToCart(page, /standard/i)
    await goToPaymentStep(page)
    await fillShippingAddress(page, {
      name: 'Alex Doe',
      line1: 'Unter den Linden 1',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Germany',
    })
    await completePayment(page)

    await expect(page.getByTestId('activation-row')).toHaveCount(1)
    await expect(page.getByTestId('shipping-row')).toHaveCount(1)
    await expect(page.getByTestId('shipping-note')).toContainText('Alex Doe')
    await expect(page.getByTestId('shipping-note')).toContainText('Berlin')
    await expect(page.getByTestId('activation-row').getByTestId('activation-code')).toBeVisible()
    await expect(page.getByTestId('shipping-row').getByTestId('activation-code')).toHaveCount(0)

    // Activation happens on Steam, outside this store, so Finish must never
    // force it - same rule checkout-payment-activation-spec.md Feature 2
    // already shipped. A physical row has nothing to activate either way.
    await expect(page.getByTestId('finish-button')).toBeEnabled()
  })

  test('an all-physical order shows only shipping rows, Finish enabled', async ({ page }) => {
    await signUpAndAddGamesToCart(page, 0)
    await addEditionToCart(page, /standard/i)
    await goToPaymentStep(page)
    await fillShippingAddress(page, {
      name: 'Alex Doe',
      line1: 'Unter den Linden 1',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Germany',
    })
    await completePayment(page)

    await expect(page.getByTestId('activation-row')).toHaveCount(0)
    await expect(page.getByTestId('shipping-row')).toHaveCount(1)
    await expect(page.getByTestId('finish-button')).toBeEnabled()
  })
})
