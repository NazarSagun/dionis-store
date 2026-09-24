import { expect, test } from '@playwright/test'

test.describe('Cart', () => {
  test('shows the empty state when no items were added', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('cart-trigger').click()

    await expect(page.getByTestId('cart-drawer')).toBeVisible()
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Discover games' })).toBeVisible()
  })
})
