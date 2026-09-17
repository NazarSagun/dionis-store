import { expect, test } from '@playwright/test'

// These specs need the local API + DB seeded with games (see the e2e package README).

test.describe('Game library', () => {
  test('lists games and opens a game details page', async ({ page }) => {
    await page.goto('/')

    const firstCard = page.getByTestId('card').first()
    await expect(firstCard).toBeVisible()

    const title = await firstCard.locator('h3').innerText()
    await firstCard.click()

    await expect(page).toHaveURL(/\/game\/\d+/)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  })
})
