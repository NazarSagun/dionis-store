import { APIRequestContext, expect, Page } from '@playwright/test'

// Shared setup for admin-panel.spec.ts (.claude/specs/app/admin-panel-spec.md).

export const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3500'
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'seed-admin@dionis-store.local'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'seed-admin-password'

export const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export async function logInAsAdmin(page: Page) {
  await page.goto('/login')
  await page.getByTestId('email').fill(ADMIN_EMAIL)
  await page.getByTestId('password').fill(ADMIN_PASSWORD)
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL('/')
}

export async function signUpCustomer(page: Page, email = `e2e-customer-${uniqueSuffix()}@dionis-store.test`) {
  await page.goto('/signup')
  await page.getByTestId('name').fill('E2E Customer')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('password123')
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL('/')
  return email
}

export async function logOut(page: Page) {
  await page.getByTestId('account-menu-trigger').click()
  await page.getByRole('menuitem', { name: 'Logout' }).click()
}

export async function apiToken(request: APIRequestContext, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  const response = await request.post(`${apiUrl}/api/login`, { data: { email, password } })
  expect(response.ok()).toBe(true)
  return (await response.json()).user.accessToken as string
}

export const newGameFields = (title: string) => ({
  Title: title,
  'Thumbnail URL': 'https://www.freetogame.com/g/1/thumbnail.jpg',
  'Short description': 'A game created by the admin panel E2E suite.',
  Genre: 'Shooter',
  Platform: 'PC (Windows)',
  Publisher: 'E2E Publisher',
  Developer: 'E2E Developer',
  'Release date': '2026-09-26',
  'List price (€)': '30',
  Rating: '4.10',
  'Discount (%)': '0',
})

// Creates a game through the admin API, so tests that are not about the
// create form start from a known game. Returns its id and title.
export async function createGameViaApi(request: APIRequestContext, title = `E2E Game ${uniqueSuffix()}`) {
  const token = await apiToken(request)
  const response = await request.post(`${apiUrl}/api/games`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      thumbnail: 'https://www.freetogame.com/g/1/thumbnail.jpg',
      short_description: 'A game created by the admin panel E2E suite.',
      genre: 'Shooter',
      platform: 'PC (Windows)',
      publisher: 'E2E Publisher',
      developer: 'E2E Developer',
      release_date: '2026-09-26',
      price: 30,
      rating: '4.10',
      discount: 0,
    },
  })
  expect(response.status()).toBe(201)
  const game = await response.json()
  return { id: game.id as number, title }
}

export async function openAdminGame(page: Page, id: number) {
  await page.goto(`/admin/games/${id}`)
  await expect(page.getByTestId('admin-game-form')).toBeVisible()
}

// The highest id among every game the storefront lists.
export async function highestGameId(request: APIRequestContext) {
  const first = await (await request.get(`${apiUrl}/api/games/1`)).json()
  let highest = 0
  for (let page = 1; page <= first.totalPages; page++) {
    const { games } = page === 1 ? first : await (await request.get(`${apiUrl}/api/games/${page}`)).json()
    for (const game of games) highest = Math.max(highest, game.id)
  }
  return highest
}
