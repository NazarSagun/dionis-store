import { APIRequestContext, expect, Page, test } from '@playwright/test'

import { apiUrl } from './helpers/admin'
import { createGameInGenre, uniqueGenre } from './helpers/recommendations'

// TDD spec for .claude/specs/showdown-spec.md. The showdown route, its
// endpoint, and the home prompt do not exist yet, so these tests fail until
// phase 4.
// Design: Figma page "Showdown", sections 1 to 4.
//
// Every bracket test makes its own games in a genre no seeded game has, so the
// whole pool is under the test's control. Reduced motion skips the pick
// animation, per the spec's cross-feature requirements.
test.use({ reducedMotion: 'reduce' })

// Ratings are strings, sorted as strings by the API. One digit before the
// point keeps that order numeric.
const RATINGS = ['4.10', '4.20', '4.30', '4.40', '4.50', '4.60', '4.70', '4.80', '4.90']

async function createGames(request: APIRequestContext, genre: string, ratings: string[]) {
  const games = []
  for (const [index, rating] of ratings.entries()) {
    games.push({ ...(await createGameInGenre(request, genre, `T${index}`, { rating })), rating })
  }
  return games
}

async function startBracket(page: Page, genre: string) {
  await page.goto('/showdown')
  await page.getByTestId('showdown-genre-chip').filter({ hasText: genre }).click()
  // The size options are listed as 8, 16, 32.
  await page.getByTestId('showdown-size-option').nth(0).click()
  await page.getByTestId('showdown-start').click()
  await expect(page.getByTestId('showdown-bracket')).toBeVisible()
}

test.describe('Feature 1: Entry points', () => {
  test('the home prompt and the toolbar button both open the showdown', async ({ page }) => {
    await page.goto('/')

    // The prompt appears 3 seconds after the page loads.
    const prompt = page.getByTestId('showdown-prompt')
    await expect(prompt).toBeVisible({ timeout: 10_000 })
    await expect(prompt).toContainText("Don't know what to play? Start a Showdown and figure it out.")
    await page.getByTestId('showdown-prompt-try').click()
    await expect(page).toHaveURL('/showdown')
    await expect(page.getByTestId('showdown-setup')).toBeVisible()

    await page.goto('/')
    await page.getByTestId('showdown-entry').click()
    await expect(page).toHaveURL('/showdown')
  })
})

test.describe('Feature 3: Showdown endpoint', () => {
  test('returns the top-rated games of the chosen genres, best first', async ({ request }) => {
    const genre = uniqueGenre()
    const games = await createGames(request, genre, RATINGS)

    const response = await request.get(`${apiUrl}/api/games/showdown?genres=${encodeURIComponent(genre)}&size=8`)
    expect(response.status()).toBe(200)
    const body = (await response.json()) as Array<{ id: number; genre: string }>

    // The 4.10 game is the lowest rated, so it is the one left out.
    const expectedIds = games
      .slice(1)
      .reverse()
      .map((game) => game.id)
    expect(body.map((game) => game.id)).toEqual(expectedIds)
    expect(body.every((game) => game.genre === genre)).toBe(true)
  })
})

test.describe('Features 2, 4, and 5: Setup, bracket, and winner', () => {
  test('plays an 8-game bracket to a winner and adds the winner to the cart', async ({ page, request }) => {
    const genre = uniqueGenre()
    const games = await createGames(request, genre, RATINGS.slice(0, 8))
    const titles = games.map((game) => game.title)

    await startBracket(page, genre)

    const progress = page.getByTestId('showdown-progress')
    const cards = page.getByTestId('showdown-match-card')
    await expect(progress).toContainText('Round 1 of 3 · Match 1 of 4')
    await expect(cards).toHaveCount(2)
    await expect(cards.nth(0)).not.toHaveText(await cards.nth(1).innerText())

    // Undo puts the first match back.
    await cards.nth(0).click()
    await expect(progress).toContainText('Match 2 of 4')
    await page.getByTestId('showdown-undo').click()
    await expect(progress).toContainText('Round 1 of 3 · Match 1 of 4')

    // 7 picks finish an 8-game bracket. Always keep the first card. The
    // progress text changes after each pick, so wait for it before the next one.
    for (let pick = 0; pick < 6; pick++) {
      const before = (await progress.textContent()) ?? ''
      await cards.nth(0).click()
      await expect(progress).not.toHaveText(before)
    }
    await cards.nth(0).click()

    const winner = page.getByTestId('showdown-winner')
    await expect(winner).toBeVisible()
    const winnerText = await winner.innerText()
    const winnerTitle = titles.find((title) => winnerText.includes(title))
    expect(winnerTitle).toBeDefined()

    const runnersUp = page.getByTestId('showdown-runner-up')
    await expect(runnersUp).toHaveCount(3)
    await expect(runnersUp.filter({ hasText: winnerTitle! })).toHaveCount(0)

    await page.getByTestId('showdown-winner-add-to-cart').click()
    await expect(page.getByTestId('cart-drawer')).toContainText(winnerTitle!)
    await page.getByTestId('cart-drawer-close').click()

    // Play again keeps the genre and the size.
    await page.getByTestId('showdown-play-again').click()
    await expect(page.getByTestId('showdown-setup')).toBeVisible()
    await expect(page.getByTestId('showdown-genre-chip').filter({ hasText: genre })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByTestId('showdown-size-option').nth(0)).toHaveAttribute('aria-pressed', 'true')
  })
})
