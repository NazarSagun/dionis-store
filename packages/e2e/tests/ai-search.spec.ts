import { expect, Page, test } from '@playwright/test'

import { createGameViaApi, uniqueSuffix } from './helpers/admin'

// TDD spec for .claude/specs/ai-search-spec.md. The "Ask AI" palette and
// POST /api/games/ai-search do not exist yet, so these tests fail until phase 4.
// Design: Figma sections "AI Search — Palette" and "AI Search — Flying transition".
//
// The E2E API runs with OPENROUTER_API_KEY set to empty, so every request takes
// the fallback path: the request text becomes a plain title search. The model
// path and the rejection are covered by unit tests in apps/api and apps/web.

const libraryCards = (page: Page) => page.getByTestId('game-library').getByTestId('card')

async function askAi(page: Page, query: string) {
  await page.getByTestId('ai-search-open').click()
  const palette = page.getByTestId('ai-search-dialog')
  await expect(palette).toBeVisible()
  await expect(page.getByTestId('ai-search-input')).toBeFocused()
  await page.getByTestId('ai-search-input').fill(query)
  await page.getByTestId('ai-search-input').press('Enter')
  return palette
}

test.describe('AI search palette', () => {
  test('from a game page, a request lands on the home page with its filters, and Back returns', async ({
    page,
    request,
  }) => {
    const title = `Zephyr Quest ${uniqueSuffix()}`
    const game = await createGameViaApi(request, title)
    await page.goto(`/game/${game.id}`)

    await page.getByTestId('ai-search-open').click()
    await expect(page.getByTestId('ai-search-hint')).toBeVisible()
    const examples = page.getByTestId('ai-search-example')
    await expect(examples).toHaveCount(3)

    // An example fills the input and does not send it.
    const exampleText = (await examples.first().getByTestId('ai-search-example-text').innerText()).trim()
    await examples.first().click()
    await expect(page.getByTestId('ai-search-input')).toHaveValue(exampleText)
    await expect(page.getByTestId('ai-search-result')).toHaveCount(0)

    await page.getByTestId('ai-search-input').fill(title)
    await page.getByTestId('ai-search-input').press('Enter')

    await expect(page.getByTestId('ai-filter-chip')).toHaveText(`Search: ${title}`)

    await expect(page).toHaveURL(`/?search=${encodeURIComponent(title).replace(/%20/g, '+')}`)
    await expect(page.getByTestId('ai-search-dialog')).toBeHidden()
    await expect(page.getByTestId('search-input')).toHaveValue(title)
    await expect(libraryCards(page)).toHaveCount(1)
    await expect(libraryCards(page).first().locator('h3')).toHaveText(title)

    await page.goBack()
    await expect(page).toHaveURL(`/game/${game.id}`)
  })

  test('from the bottom of the home page, the result brings the toolbar into view', async ({ page, request }) => {
    const title = `Zephyr Depths ${uniqueSuffix()}`
    await createGameViaApi(request, title)
    await page.goto('/')
    await expect(libraryCards(page).first()).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.getByTestId('search-input')).not.toBeInViewport()

    await askAi(page, title)

    await expect(page.getByTestId('ai-search-dialog')).toBeHidden()
    await expect(page.getByTestId('search-input')).toBeInViewport()
    await expect(page.getByTestId('search-input')).toHaveValue(title)
    await expect(libraryCards(page)).toHaveCount(1)
  })
})
