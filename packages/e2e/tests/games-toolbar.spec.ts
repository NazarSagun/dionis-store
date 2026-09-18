import { expect, Page, test } from '@playwright/test'

// These specs need the local API + DB seeded with games (see the e2e package README),
// including the PS5/Xbox/Switch fixture rows added for this feature.

async function selectFromDropdown(page: Page, triggerTestId: string, optionTestId: string) {
  await page.getByTestId(triggerTestId).click()
  await page.getByTestId(optionTestId).click()
}

test.describe('Search, filter, and sort toolbar', () => {
  test('filters the grid by title as the user types', async ({ page }) => {
    await page.goto('/')

    const firstCard = page.getByTestId('card').first()
    await expect(firstCard).toBeVisible()
    const knownTitle = await firstCard.locator('h3').innerText()
    const fragment = knownTitle.slice(0, 4)

    await page.getByTestId('search-input').fill(fragment)

    const cards = page.getByTestId('card')
    await expect(cards).toHaveCount(1)
    await expect(cards.first().locator('h3')).toContainText(fragment, { ignoreCase: true })
  })

  test('clearing the search field returns the full list', async ({ page }) => {
    await page.goto('/')

    const firstCard = page.getByTestId('card').first()
    const originalTitle = await firstCard.locator('h3').innerText()

    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('zzz-no-such-game-zzz')
    await expect(page.getByTestId('card')).toHaveCount(0)

    await searchInput.fill('')
    await expect(page.getByTestId('card').first().locator('h3')).toHaveText(originalTitle)
  })

  test('filters the grid by platform', async ({ page }) => {
    await page.goto('/')

    await selectFromDropdown(page, 'platform-filter', 'platform-option-PS5')

    const cards = page.getByTestId('card')
    await expect(cards).toHaveCount(2)
    await expect(cards.first()).toContainText('PS5')
    await expect(cards.last()).toContainText('PS5')
  })

  test('sorts the grid by price low to high', async ({ page }) => {
    await page.goto('/')

    await selectFromDropdown(page, 'sort-select', 'sort-option-price_asc')

    const priceTexts = await page.getByTestId('card').locator('text=/€\\d+/').allInnerTexts()
    const prices = priceTexts.map((text) => Number(text.replace('€', '')))

    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  test('combines a search term and a platform filter', async ({ page }) => {
    await page.goto('/')

    await selectFromDropdown(page, 'platform-filter', 'platform-option-PS5')
    const cards = page.getByTestId('card')
    await expect(cards).toHaveCount(2)
    const ps5Title = await cards.first().locator('h3').innerText()

    await page.getByTestId('search-input').fill(ps5Title.slice(0, 4))

    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('PS5')
  })

  test('updates pagination when the filtered result set shrinks', async ({ page }) => {
    await page.goto('/')

    await selectFromDropdown(page, 'platform-filter', 'platform-option-Switch')

    await expect(page.getByTestId('card')).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'pagination' })).not.toContainText('2')
  })
})
