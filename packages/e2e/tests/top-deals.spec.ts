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

  test('every deal from the API carries the store review summary', async ({ request }) => {
    const deals = await (await request.get(`${apiUrl}/api/games/top-deals`)).json()

    for (const deal of deals) {
      expect(deal).toHaveProperty('averageRating')
      expect(typeof deal.reviewCount).toBe('number')
    }
  })

  test('shows the store average and review count on the featured deal', async ({ page }) => {
    await page.route('**/api/games/top-deals', async (route) => {
      const response = await route.fetch()
      const deals = await response.json()
      deals[0] = { ...deals[0], averageRating: 4.5, reviewCount: 12 }
      await route.fulfill({ response, json: deals })
    })

    await page.goto('/')

    const featured = page.getByTestId('featured-deal')
    await expect(featured.getByTestId('featured-average')).toHaveText('4.5')
    await expect(featured.getByTestId('featured-count')).toHaveText('(12)')
  })

  test('shows no store score on the featured deal when it has no review', async ({ page }) => {
    await page.route('**/api/games/top-deals', async (route) => {
      const response = await route.fetch()
      const deals = await response.json()
      deals[0] = { ...deals[0], averageRating: null, reviewCount: 0 }
      await route.fulfill({ response, json: deals })
    })

    await page.goto('/')

    await expect(page.getByTestId('featured-deal')).toBeVisible()
    await expect(page.getByTestId('featured-reviews')).toHaveCount(0)
  })
})
