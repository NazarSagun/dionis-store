import { expect, test } from '@playwright/test'

// Needs the local API + DB seeded with games (see the e2e package README).
// The seed script only discounts ~15% of games, so this section should be
// non-empty but not simply "every card in the catalog."
//
// TopDeals.tsx renders the first (highest-discount) game from
// GET /games/top-deals as a single "featured-deal" and up to three more as
// "next-up-row" entries - not a grid of GameCards, and no discount-badge
// element exists in this layout. Cross-check against the API's own response
// instead of parsing discount percentages back out of rendered price text.

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3500'

test.describe('Top Deals section', () => {
  test('features the top discount, lists up to three more in Next Up, in the API’s own order', async ({
    page,
    request,
  }) => {
    const response = await request.get(`${apiUrl}/api/games/top-deals`)
    const deals = await response.json()
    expect(deals.length).toBeGreaterThan(0)

    await page.goto('/')

    const section = page.getByTestId('top-deals')
    await expect(section).toBeVisible()

    await expect(section.getByTestId('featured-deal')).toContainText(deals[0].title)

    const expectedNextUp = deals.slice(1, 4)
    const nextUpRows = section.getByTestId('next-up-row')
    await expect(nextUpRows).toHaveCount(expectedNextUp.length)

    for (const [index, deal] of expectedNextUp.entries()) {
      await expect(nextUpRows.nth(index)).toContainText(deal.title)
    }
  })
})
