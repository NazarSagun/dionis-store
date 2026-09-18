import { expect, test } from '@playwright/test'

// Needs the local API + DB seeded with games (see the e2e package README).
// The seed script only discounts ~15% of games, so this section should be
// non-empty but not simply "every card in the catalog."

test.describe('Top Deals section', () => {
  test('shows up to 10 discounted games, ordered by discount, each with a badge', async ({ page }) => {
    await page.goto('/')

    const section = page.getByTestId('top-deals')
    await expect(section).toBeVisible()

    const cards = section.getByTestId('card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(10)

    const badgeTexts = await section.getByTestId('discount-badge').allInnerTexts()
    expect(badgeTexts).toHaveLength(count)

    const discounts = badgeTexts.map((text) => Number(text.replace('-', '').replace('%', '')))
    expect(discounts).toEqual([...discounts].sort((a, b) => b - a))
  })
})
