import { expect, test } from '@playwright/test'

import {
  addDigitalCopyToCart,
  addEditionToCart,
  completePayment,
  fillShippingAddress,
  goToPaymentStep,
  signUpAndAddGamesToCart,
} from './helpers/checkout'
import { countReceiptsAfterDelay, waitForReceipts } from './helpers/mail'

// TDD spec for email-receipts-spec.md, Feature 1 (receipt email). The API has
// no mail code today, so every test below fails until MailService sends the
// receipt. The API must run with SMTP_HOST pointing at Mailpit. Design:
// https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=255-353

test.describe('Order receipt email', () => {
  test('a digital order sends one receipt with the order number, the total, and the activation code', async ({
    page,
    request,
  }) => {
    const email = await signUpAndAddGamesToCart(page, 1)
    await goToPaymentStep(page)
    await completePayment(page)

    const code = (await page.getByTestId('activation-code').first().innerText()).trim()

    const [receipt] = await waitForReceipts(request, email)

    expect(receipt.Subject).toMatch(/^Your Dionis Store order #\d+$/)
    expect(receipt.HTML).toContain(code)
    expect(receipt.Text).toContain(code)
    expect(receipt.HTML).toContain('View your order')
    expect(receipt.HTML).toMatch(/href="[^"]*\/account"/)
  })

  test('a physical order shows the shipping address and no activation code', async ({ page, request }) => {
    const email = await signUpAndAddGamesToCart(page, 0)
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

    const [receipt] = await waitForReceipts(request, email)

    expect(receipt.Text).toContain('Alex Doe')
    expect(receipt.Text).toContain('Unter den Linden 1')
    expect(receipt.Text).toContain('Berlin')
    expect(receipt.Text).not.toMatch(/ACTIVATION CODE/i)
  })

  test('a mixed order sends one receipt that holds the code and the address', async ({ page, request }) => {
    const email = await signUpAndAddGamesToCart(page, 0)
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

    const code = (await page.getByTestId('activation-code').first().innerText()).trim()
    const [receipt] = await waitForReceipts(request, email)

    expect(receipt.Text).toContain(code)
    expect(receipt.Text).toContain('Berlin')
    // The browser path and the Stripe webhook both create the order. Only one
    // of them may send the email.
    expect(await countReceiptsAfterDelay(request, email)).toBe(1)
  })
})
