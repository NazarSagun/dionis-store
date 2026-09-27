import { expect, Page, test } from '@playwright/test'

// These specs need the local API + DB seeded with games (see the e2e package README),
// including the PS5/Xbox/Switch fixture rows added for this feature.
//
// Card queries are scoped to the `game-library` container: the Top Deals
// section (Feature 2) also renders `card`-testid elements, unaffected by
// these toolbar filters, so an unscoped `page.getByTestId('card')` would
// double-count.

// Options share one test id per dropdown, so pick one by its exact label.
async function selectFromDropdown(page: Page, triggerTestId: string, optionTestId: string, label: string) {
  await page.getByTestId(triggerTestId).click()
  await page
    .getByTestId(optionTestId)
    .filter({ has: page.getByText(label, { exact: true }) })
    .click()
}

const libraryCards = (page: Page) => page.getByTestId('game-library').getByTestId('card')

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3500'

test.describe('Search, filter, and sort toolbar', () => {
  test('filters the grid by title as the user types', async ({ page }) => {
    await page.goto('/')

    const firstCard = libraryCards(page).first()
    await expect(firstCard).toBeVisible()
    const knownTitle = await firstCard.locator('h3').innerText()
    const fragment = knownTitle.slice(0, 4)

    await page.getByTestId('search-input').fill(fragment)

    const cards = libraryCards(page)
    await expect(cards).toHaveCount(1)
    await expect(cards.first().locator('h3')).toContainText(fragment, { ignoreCase: true })
  })

  test('clearing the search field returns the full list', async ({ page }) => {
    await page.goto('/')

    const firstCard = libraryCards(page).first()
    const originalTitle = await firstCard.locator('h3').innerText()

    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('zzz-no-such-game-zzz')
    await expect(libraryCards(page)).toHaveCount(0)

    await searchInput.fill('')
    await expect(libraryCards(page).first().locator('h3')).toHaveText(originalTitle)
  })

  test('filters the grid by platform', async ({ page }) => {
    await page.goto('/')

    await selectFromDropdown(page, 'platform-filter', 'platform-filter-option', 'PS5')

    const cards = libraryCards(page)
    await expect(cards).toHaveCount(2)
    await expect(cards.first()).toContainText('PS5')
    await expect(cards.last()).toContainText('PS5')
  })

  test('sorts the grid by price low to high', async ({ page, request }) => {
    await page.goto('/')

    await selectFromDropdown(page, 'sort-select', 'sort-option', 'Price (low to high)')

    // price_asc sorts by list price (games.service.ts), not the discounted
    // price a card may display, so the two can disagree on any discounted
    // card. Compare rendered order against the API's own order instead of
    // parsing price text back out of the DOM.
    const response = await request.get(`${apiUrl}/api/games/1?sort=price_asc`)
    const { games } = await response.json()
    const expectedTitles = games.map((game: { title: string }) => game.title)

    // toHaveText retries until the sorted page has loaded, unlike allInnerTexts.
    await expect(libraryCards(page).locator('h3')).toHaveText(expectedTitles)
  })

  test('combines a search term and a platform filter', async ({ page }) => {
    await page.goto('/')

    await selectFromDropdown(page, 'platform-filter', 'platform-filter-option', 'PS5')
    const cards = libraryCards(page)
    await expect(cards).toHaveCount(2)
    const ps5Title = await cards.first().locator('h3').innerText()

    await page.getByTestId('search-input').fill(ps5Title.slice(0, 4))

    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('PS5')
  })

  test('updates pagination when the filtered result set shrinks', async ({ page }) => {
    await page.goto('/')

    await selectFromDropdown(page, 'platform-filter', 'platform-filter-option', 'Switch')

    await expect(libraryCards(page)).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'pagination' })).not.toContainText('2')
  })

  test('clear filters resets search, platform, and sort in one click', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('search-input').fill('zzz-no-such-game-zzz')
    await selectFromDropdown(page, 'platform-filter', 'platform-filter-option', 'PS5')
    await selectFromDropdown(page, 'sort-select', 'sort-option', 'Price (low to high)')
    await expect(libraryCards(page)).toHaveCount(0)

    await page.getByTestId('clear-filters').click()

    await expect(page.getByTestId('search-input')).toHaveValue('')
    await expect(page.getByTestId('platform-filter')).toHaveText(/platform/i)
    await expect(page.getByTestId('sort-select')).toHaveText(/sort/i)
    await expect(libraryCards(page).first()).toBeVisible()
  })
})

// roadmap-spec.md Feature 1.3: every filter lives in the URL, genre and price
// filters exist, and price means the discounted price a card shows.
test.describe('Filters in the URL', () => {
  const discounted = (game: { price: number; discount: number }) => (game.price * (100 - game.discount)) / 100

  test('a link with filters opens the grid already filtered', async ({ page, request }) => {
    await page.goto('/?genre=Shooter&maxPrice=20')

    await expect(page.getByTestId('genre-filter')).toHaveText(/Shooter/)
    await expect(page.getByTestId('price-filter')).toHaveText(/Up to €20/)

    const response = await request.get(`${apiUrl}/api/games/1?genre=Shooter&maxPrice=20`)
    const { games } = await response.json()
    expect(games.length).toBeGreaterThan(0)
    for (const game of games) {
      expect(game.genre).toBe('Shooter')
      expect(discounted(game)).toBeLessThanOrEqual(20)
    }
    await expect(libraryCards(page).locator('h3')).toHaveText(games.map((game: { title: string }) => game.title))
  })

  test('the price filter uses the discounted price, not the list price', async ({ page, request }) => {
    const topDeals = await (await request.get(`${apiUrl}/api/games/top-deals`)).json()
    const deal = topDeals[0]
    const maxPrice = Math.ceil(discounted(deal))
    expect(deal.price).toBeGreaterThan(maxPrice)

    await page.goto(`/?search=${encodeURIComponent(deal.title)}&maxPrice=${maxPrice}`)

    await expect(libraryCards(page).locator('h3')).toHaveText([deal.title])
  })

  test('changing a filter updates the URL, and Back restores the earlier filters', async ({ page }) => {
    await page.goto('/')
    await expect(libraryCards(page).first()).toBeVisible()

    await selectFromDropdown(page, 'platform-filter', 'platform-filter-option', 'PS5')
    await expect(page).toHaveURL(/[?&]platform=PS5/)
    await selectFromDropdown(page, 'genre-filter', 'genre-filter-option', 'Shooter')
    await expect(page).toHaveURL(/[?&]genre=Shooter/)

    await page.goBack()
    await expect(page).not.toHaveURL(/genre=/)
    await expect(page).toHaveURL(/[?&]platform=PS5/)
    await expect(page.getByTestId('genre-filter')).toHaveText(/All/)

    await page.goBack()
    await expect(page.getByTestId('platform-filter')).toHaveText(/All/)
  })

  test('the page number is in the URL and survives a reload', async ({ page, request }) => {
    await page.goto('/?page=2')

    const { games } = await (await request.get(`${apiUrl}/api/games/2`)).json()
    await expect(libraryCards(page).first().locator('h3')).toHaveText(games[0].title)

    await page.reload()
    await expect(libraryCards(page).first().locator('h3')).toHaveText(games[0].title)
  })

  test('clear filters also clears the URL', async ({ page }) => {
    await page.goto('/?platform=PS5&genre=Shooter&sort=price_asc&maxPrice=30')

    await page.getByTestId('clear-filters').click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('genre-filter')).toHaveText(/All/)
    await expect(page.getByTestId('price-filter')).toHaveText(/Any/)
  })

  test('an unknown filter value in the URL is ignored', async ({ page }) => {
    await page.goto('/?platform=Commodore64&sort=random&maxPrice=cheap')

    await expect(libraryCards(page).first()).toBeVisible()
    await expect(page.getByTestId('platform-filter')).toHaveText(/All/)
    await expect(page.getByTestId('price-filter')).toHaveText(/Any/)
  })
})

test.describe('No matching games', () => {
  test('a search with no results shows an empty state that names the search', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('search-input').fill('zzz-no-such-game-zzz')

    const empty = page.getByTestId('games-empty')
    await expect(empty).toBeVisible()
    await expect(empty).toContainText('No games match "zzz-no-such-game-zzz"')
    await expect(page.getByRole('navigation', { name: 'pagination' })).toHaveCount(0)
  })

  test('filters with no results show the empty state, and its button clears them', async ({ page }) => {
    await page.goto('/?genre=Shooter&minPrice=1000')

    const empty = page.getByTestId('games-empty')
    await expect(empty).toContainText('No games match these filters')

    await empty.getByRole('button', { name: 'Clear filters' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(empty).toHaveCount(0)
    await expect(libraryCards(page).first()).toBeVisible()
  })
})
