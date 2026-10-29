import { APIRequestContext, expect, Page, test } from '@playwright/test'

import { apiUrl, createGameViaApi, logInAsAdmin, openAdminGame } from './helpers/admin'
import { openFirstGameDetails } from './helpers/checkout'

// TDD spec for .claude/specs/rich-game-details-spec.md: the curated catalog,
// the gallery with the trailer as its first item, the description sections,
// and the admin fields for the trailer and the sections. These tests fail
// until phase 4 lands.
// Design: Figma section "Game Details", frames "Game Details — Notify me
// (code, 1440)" and its tablet and mobile frames; section "Admin", frame
// "Admin — Edit game".
//
// Fixture assumption: the seed holds the 50 curated games from
// apps/api/src/db-seed/games/games.json, and the first card on the home page
// has a trailer and at least four images, as every curated game does.
//
// An API login as the admin ends the browser's admin session (one refresh
// token per user), so the admin test creates its game before the browser
// logs in, and the file runs in order in one worker.
test.describe.configure({ mode: 'default' })

const gameIdFromUrl = (page: Page) => Number(new URL(page.url()).pathname.split('/').pop())

async function fetchGame(request: APIRequestContext, gameId: number) {
  const response = await request.get(`${apiUrl}/api/game/${gameId}`)
  expect(response.ok()).toBe(true)
  return response.json()
}

test.describe('Feature 3: Curated catalog', () => {
  test('the seed creates 50 games that every platform filter can show', async ({ request }) => {
    // Other spec files add their own games, so a full run can have more pages.
    const first = await (await request.get(`${apiUrl}/api/games/1`)).json()
    expect(first.totalPages).toBeGreaterThanOrEqual(3)

    for (const platform of ['PC', 'PS5', 'Xbox', 'Switch']) {
      const response = await request.get(`${apiUrl}/api/games/1?platform=${platform}`)
      const { games } = await response.json()
      expect(games.length, `${platform} games`).toBeGreaterThanOrEqual(8)
    }
  })
})

test.describe('Feature 4: Game detail page', () => {
  test('the API returns the images, the trailer, and the sections of a curated game', async ({ page, request }) => {
    await openFirstGameDetails(page)
    const game = await fetchGame(request, gameIdFromUrl(page))

    expect(game.images.length).toBeGreaterThanOrEqual(4)
    expect(game.trailerYoutubeId).toMatch(/^[A-Za-z0-9_-]{11}$/)
    expect(game.sections[0].kind).toBe('about')
    expect(game.coverUrl).toBeTruthy()
    expect(game.ageRatings.length).toBeGreaterThan(0)
    expect(game.criticRating).toBeGreaterThan(0)
    expect(game.languages.length).toBeGreaterThan(0)
  })

  test('a user sees the cover, age ratings, IGDB scores, and languages', async ({ page, request }) => {
    await openFirstGameDetails(page)
    const game = await fetchGame(request, gameIdFromUrl(page))

    await expect(page.getByTestId('game-cover')).toBeVisible()
    await expect(page.getByTestId('age-rating')).toHaveText(game.ageRatings)
    await expect(page.getByTestId('critic-score')).toContainText(String(game.criticRating))
    await expect(page.getByTestId('user-score')).toContainText(String(game.userRating))
    await expect(page.getByTestId('language-row')).toHaveCount(game.languages.length)
  })

  test('a user browses the gallery, starting on the trailer', async ({ page, request }) => {
    await openFirstGameDetails(page)
    const game = await fetchGame(request, gameIdFromUrl(page))

    const gallery = page.getByTestId('game-gallery')
    const thumbs = gallery.getByTestId('gallery-thumb')
    const mainSlot = gallery.getByTestId('gallery-main-image')

    await expect(thumbs).toHaveCount(game.images.length + 1)
    await expect(thumbs.first()).toHaveAttribute('data-kind', 'video')
    await expect(gallery.getByTestId('trailer-play')).toBeVisible()

    await thumbs.nth(2).click()
    await expect(mainSlot.locator('img')).toHaveAttribute('alt', game.images[1].alt)

    await thumbs.last().click()
    await gallery.getByTestId('gallery-next').click()
    await expect(gallery.getByTestId('trailer-play')).toBeVisible()
  })

  test('the trailer loads from YouTube only after the user clicks play', async ({ page, request }) => {
    const youtubeRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('youtube-nocookie.com')) youtubeRequests.push(request.url())
    })

    await openFirstGameDetails(page)
    const game = await fetchGame(request, gameIdFromUrl(page))
    const gallery = page.getByTestId('game-gallery')
    await expect(gallery.getByTestId('trailer-play')).toBeVisible()
    expect(youtubeRequests).toHaveLength(0)

    await gallery.getByTestId('trailer-play').click()
    const frame = gallery.getByTestId('trailer-frame')
    await expect(frame).toHaveAttribute('src', new RegExp(`youtube-nocookie\\.com/embed/${game.trailerYoutubeId}`))

    await gallery.getByTestId('gallery-next').click()
    await expect(frame).toHaveCount(0)
    await expect(gallery.getByTestId('gallery-main-image').locator('img')).toHaveAttribute('alt', game.images[0].alt)
  })

  test('a user reads the description sections in order, with the Features list', async ({ page, request }) => {
    const { id } = await createGameViaApi(request, undefined, {
      sections: [
        { kind: 'about', title: 'About', body: 'First paragraph.\n\nSecond paragraph.', position: 0 },
        { kind: 'features', title: 'Features', body: '- Co-op hunts\n- Cross-play', position: 1 },
      ],
    })

    await page.goto(`/game/${id}`, { waitUntil: 'domcontentloaded' })
    const sections = page.getByTestId('game-section')
    await expect(sections).toHaveCount(2)
    await expect(sections.first()).toHaveAttribute('data-kind', 'about')
    await expect(sections.first().getByTestId('game-section-title')).toHaveText('About')
    await expect(sections.first().getByTestId('game-section-body').locator('p')).toHaveCount(2)
    await expect(sections.last().getByTestId('game-section-body').locator('li')).toHaveText([
      'Co-op hunts',
      'Cross-play',
    ])
  })
})

test.describe('Feature 5: Admin content editing', () => {
  test('an admin edits the About text and removes the trailer', async ({ page, request }) => {
    const { id } = await createGameViaApi(request, undefined, {
      trailerYoutubeId: 'dQw4w9WgXcQ',
      sections: [{ kind: 'about', title: 'About', body: 'The first About text.', position: 0 }],
    })

    await logInAsAdmin(page)
    await openAdminGame(page, id)
    const form = page.getByTestId('admin-game-form')
    await expect(form.getByTestId('admin-trailer-input')).toHaveValue('dQw4w9WgXcQ')

    await form.getByLabel('About', { exact: true }).fill('A new About text from the admin panel.')
    await form.getByTestId('admin-trailer-input').fill('')
    await page.getByTestId('admin-game-save').click()

    await page.goto(`/game/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('game-section').first().getByTestId('game-section-body')).toHaveText(
      'A new About text from the admin panel.',
    )
    await expect(page.getByTestId('trailer-play')).toHaveCount(0)

    const game = await fetchGame(request, id)
    expect(game.trailerYoutubeId).toBeNull()
    expect(game.sections).toEqual([
      expect.objectContaining({ kind: 'about', body: 'A new About text from the admin panel.' }),
    ])
  })
})
