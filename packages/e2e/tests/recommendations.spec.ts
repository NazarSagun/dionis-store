import { expect, test } from '@playwright/test'

import { apiUrl, signUpCustomer } from './helpers/admin'
import {
  createGameInGenre,
  fetchRecommendations,
  recommendationsQuery,
  recommendationsUrl,
  uniqueGenre,
} from './helpers/recommendations'
import { buyGame } from './helpers/reviews'

// TDD spec for .claude/specs/recommendations-spec.md. The recommendations
// route and the "Because you viewed" strip do not exist yet, so these tests
// fail until phase 4.
// Design: Figma sections "Account" and "Game Details", the strip below the
// recently viewed games and below "What's in each edition".
//
// Every test makes its own games in a genre no seeded game has, so the whole
// candidate pool is under the test's control. Titles start with a letter that
// sets the order inside a genre, because ties sort by title.
//
// The response is read as a JSON array of games, each with an `id` and a
// `title`, the shape of one item of `GET /api/games/:page`.
test.describe.configure({ mode: 'default' })

test.describe('Feature 1: Recommendations API', () => {
  test('ranks the genres of the seeds by count, sorts a genre by title, and skips seeds and exclusions', async ({
    request,
  }) => {
    const action = uniqueGenre()
    const rpg = uniqueGenre()
    const [a1, a2] = [await createGameInGenre(request, action, 'A1'), await createGameInGenre(request, action, 'A2')]
    const a4 = await createGameInGenre(request, action, 'A4')
    const a3 = await createGameInGenre(request, action, 'A3')
    const a5 = await createGameInGenre(request, action, 'A5')
    const r1 = await createGameInGenre(request, rpg, 'R1')
    const r2 = await createGameInGenre(request, rpg, 'R2')

    // Two action seeds and one RPG seed: action games first.
    const result = await fetchRecommendations(request, [a1.id, a2.id, r1.id], [a5.id], 12)

    expect(result.map((game) => game.id)).toEqual([a3.id, a4.id, r2.id])
  })

  test('ignores an unknown seed, and returns nothing when no seed is a game', async ({ request }) => {
    const genre = uniqueGenre()
    const seed = await createGameInGenre(request, genre, 'S')
    const other = await createGameInGenre(request, genre, 'T')

    const withUnknown = await fetchRecommendations(request, [seed.id, 2_000_000_000])
    expect(withUnknown.map((game) => game.id)).toEqual([other.id])

    expect(await fetchRecommendations(request, [2_000_000_000])).toEqual([])
  })

  test('limit caps the result, and the default is 6', async ({ request }) => {
    const genre = uniqueGenre()
    const seed = await createGameInGenre(request, genre, 'S')
    for (let i = 0; i < 8; i++) await createGameInGenre(request, genre, `G${i}`)

    expect(await fetchRecommendations(request, [seed.id])).toHaveLength(6)
    expect(await fetchRecommendations(request, [seed.id], undefined, 3)).toHaveLength(3)
    expect(await fetchRecommendations(request, [seed.id], undefined, 12)).toHaveLength(8)
  })

  test('rejects a bad query with 400', async ({ request }) => {
    const get = (url: string) => request.get(url)
    const ids = Array.from({ length: 31 }, (_, i) => i + 1)
    // A valid query must work first. Without the route, `recommendations` is read as a page number and every
    // request below returns 400 for the wrong reason.
    const seed = await createGameInGenre(request, uniqueGenre(), 'S')
    expect((await get(recommendationsQuery([seed.id]))).status()).toBe(200)

    expect((await get(recommendationsUrl)).status()).toBe(400)
    expect((await get(recommendationsQuery('abc'))).status()).toBe(400)
    expect((await get(recommendationsQuery('1,x'))).status()).toBe(400)
    expect((await get(recommendationsQuery('0'))).status()).toBe(400)
    expect((await get(recommendationsQuery(ids))).status()).toBe(400)
    expect(
      (
        await get(
          recommendationsQuery(
            [1],
            Array.from({ length: 61 }, (_, i) => i + 1),
          ),
        )
      ).status(),
    ).toBe(400)
    expect((await get(recommendationsQuery([1], undefined, 13))).status()).toBe(400)
    expect((await get(recommendationsQuery([1], undefined, 0))).status()).toBe(400)
  })

  test('works without a token, and is not cached', async ({ request }) => {
    const genre = uniqueGenre()
    const seed = await createGameInGenre(request, genre, 'S')
    await createGameInGenre(request, genre, 'T')

    const response = await request.get(recommendationsQuery([seed.id]))

    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toContain('no-store')
    expect(JSON.stringify(await response.json())).not.toMatch(/email|userId/)
  })
})

test.describe('Feature 2: "Because you viewed" strip', () => {
  test.beforeEach(() => test.setTimeout(60_000))

  test('a guest sees other games of the viewed genre on a game page, and never the game on the page', async ({
    page,
    request,
  }) => {
    const genre = uniqueGenre()
    const first = await createGameInGenre(request, genre, 'A')
    const second = await createGameInGenre(request, genre, 'B')
    const third = await createGameInGenre(request, genre, 'C')
    const fourth = await createGameInGenre(request, genre, 'D')

    await page.goto(`/game/${first.id}`)
    await page.goto(`/game/${second.id}`)
    await page.goto(`/game/${third.id}`)

    const strip = page.getByTestId('recommendations')
    await expect(page.getByTestId('recommendations-title')).toHaveText('Because you viewed')
    // The game on the page is the third. The first two are views, so they are seeds and are never listed.
    await expect(strip.getByTestId('recommendation-card')).toHaveCount(1)
    await expect(strip.getByTestId('recommendation-card')).toContainText(fourth.title)
    await expect(strip).not.toContainText(third.title)
  })

  test('the strip shows at most 6 cards, and a click opens that game', async ({ page, request }) => {
    const genre = uniqueGenre()
    const seed = await createGameInGenre(request, genre, 'A')
    const games = []
    for (let i = 0; i < 8; i++) games.push(await createGameInGenre(request, genre, `G${i}`))

    await page.goto(`/game/${seed.id}`)

    const cards = page.getByTestId('recommendation-card')
    await expect(cards).toHaveCount(6)
    // Titles sort inside a genre, so the first card is the first game made.
    await expect(cards.first()).toContainText(games[0].title)
    await cards.first().click()
    await expect(page).toHaveURL(`/game/${games[0].id}`)
  })

  test('the strip shows a skeleton while the request runs', async ({ page, request }) => {
    const genre = uniqueGenre()
    const seed = await createGameInGenre(request, genre, 'A')
    await createGameInGenre(request, genre, 'B')
    await page.route('**/api/games/recommendations*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_000))
      await route.continue()
    })

    await page.goto(`/game/${seed.id}`)

    await expect(page.getByTestId('recommendations-skeleton')).toBeVisible()
    await expect(page.getByTestId('recommendation-card')).toHaveCount(1)
    await expect(page.getByTestId('recommendations-skeleton')).toHaveCount(0)
  })

  test('the strip renders nothing when the request fails or the genre has no other game', async ({ page, request }) => {
    const alone = await createGameInGenre(request, uniqueGenre(), 'A')
    await page.goto(`/game/${alone.id}`)
    await expect(page.getByTestId('recommendations-skeleton')).toHaveCount(0)
    await expect(page.getByTestId('recommendations')).toHaveCount(0)

    const genre = uniqueGenre()
    const seed = await createGameInGenre(request, genre, 'A')
    await createGameInGenre(request, genre, 'B')
    await page.route('**/api/games/recommendations*', (route) =>
      route.fulfill({
        status: 500,
        json: { message: 'Internal server error' },
      }),
    )
    await page.goto(`/game/${seed.id}`)
    await expect(page.getByTestId('recommendations-skeleton')).toHaveCount(0)
    await expect(page.getByTestId('recommendations')).toHaveCount(0)
    // No error text on the page either, because the strip is optional.
    await expect(page.getByText('Internal server error')).toHaveCount(0)
  })

  test('a signed-in owner does not see the game they own in the strip', async ({ page, request }) => {
    test.setTimeout(120_000)
    const genre = uniqueGenre()
    const owned = await createGameInGenre(request, genre, 'A')
    const unowned = await createGameInGenre(request, genre, 'B')
    const view = await createGameInGenre(request, genre, 'C')
    await signUpCustomer(page)
    await buyGame(page, owned.id)

    await page.goto(`/game/${view.id}`)

    const strip = page.getByTestId('recommendations')
    await expect(strip).toContainText(unowned.title)
    await expect(strip).not.toContainText(owned.title)
  })

  test('the account page shows the strip below Recently Viewed, with the viewed games as seeds', async ({
    page,
    request,
  }) => {
    const genre = uniqueGenre()
    const seed = await createGameInGenre(request, genre, 'A')
    const candidate = await createGameInGenre(request, genre, 'B')
    await signUpCustomer(page)
    await page.goto(`/game/${seed.id}`)

    await page.goto('/account')

    await expect(page.getByTestId('recently-viewed')).toBeVisible()
    await expect(page.getByTestId('recommendations-title')).toHaveText('Because you viewed')
    await expect(page.getByTestId('recommendations')).toContainText(candidate.title)
    // The viewed game is a seed, so the strip never lists it.
    await expect(page.getByTestId('recommendations')).not.toContainText(seed.title)
  })

  test('a user with owned games and no recent views sees "Based on your library"', async ({ page, request }) => {
    test.setTimeout(120_000)
    const genre = uniqueGenre()
    const owned = await createGameInGenre(request, genre, 'A')
    const candidate = await createGameInGenre(request, genre, 'B')
    await signUpCustomer(page)
    await buyGame(page, owned.id)
    await page.evaluate(() => localStorage.removeItem('recently-viewed-storage'))

    await page.goto('/account')

    await expect(page.getByTestId('recently-viewed')).toHaveCount(0)
    await expect(page.getByTestId('recommendations-title')).toHaveText('Based on your library')
    await expect(page.getByTestId('recommendations')).toContainText(candidate.title)
    await expect(page.getByTestId('recommendations')).not.toContainText(owned.title)
  })

  test('a user with no recent views and no owned games sees no strip on the account page', async ({ page }) => {
    await signUpCustomer(page)

    await page.goto('/account')

    await expect(page.getByTestId('account-page')).toBeVisible()
    await expect(page.getByTestId('recommendations')).toHaveCount(0)
    await expect(page.getByTestId('recommendations-skeleton')).toHaveCount(0)
  })

  test('the strip sends the recently viewed ids as seeds', async ({ page, request }) => {
    const genre = uniqueGenre()
    const first = await createGameInGenre(request, genre, 'A')
    const second = await createGameInGenre(request, genre, 'B')
    await createGameInGenre(request, genre, 'C')
    const seen: string[] = []
    await page.route('**/api/games/recommendations*', (route) => {
      seen.push(route.request().url())
      return route.continue()
    })

    await page.goto(`/game/${first.id}`)
    await page.goto(`/game/${second.id}`)
    await expect(page.getByTestId('recommendation-card')).toHaveCount(1)

    const params = new URL(seen[seen.length - 1], apiUrl).searchParams
    const seeds = (params.get('seedGameIds') ?? '').split(',').map(Number)
    expect(seeds).toEqual(expect.arrayContaining([first.id, second.id]))
    expect((params.get('excludeGameIds') ?? '').split(',').map(Number)).toContain(second.id)
  })
})
