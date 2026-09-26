import { Browser, expect, Page, test } from '@playwright/test'

// TDD spec for roadmap-spec.md Feature 1.2: a signed-in player's wishlist is
// stored on their account, so it is the same in every browser. A guest keeps
// the local wishlist, which merges into the account on login. Logout clears
// the local copy.

const PASSWORD = 'password123'

function uniqueEmail() {
  return `e2e-wishlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@dionis-store.test`
}

async function signUp(page: Page, email: string) {
  await page.goto('/signup')
  await page.getByTestId('name').fill('E2E Wishlist Player')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill(PASSWORD)
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL('/')
}

async function logIn(page: Page, email: string) {
  await page.goto('/login')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill(PASSWORD)
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL('/')
}

async function logOut(page: Page) {
  await page.getByTestId('account-menu-trigger').click()
  await page.getByRole('menuitem', { name: 'Logout' }).click()
}

// Clicks the heart on a home page card, waits for its label to flip, then
// for the save request to finish: the next step is a full page load, which
// would cancel a request still in flight.
async function wishlistFromHome(page: Page, index: number) {
  await page.goto('/')
  const card = page.getByTestId('card').nth(index)
  await card.getByRole('button', { name: 'Add to wishlist' }).click()
  await expect(card.getByRole('button', { name: 'Remove from wishlist' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  return card.locator('h3').innerText()
}

function accountWishlistTitles(page: Page) {
  return page.getByTestId('wishlist').getByTestId('wishlist-row').locator('h3')
}

async function openAccountWishlist(page: Page) {
  await page.goto('/account')
  await page.getByTestId('account-tab-wishlist').click()
}

async function newPage(browser: Browser) {
  const context = await browser.newContext()
  return context.newPage()
}

test.describe('Wishlist saved to the account', () => {
  test('a game wishlisted in one browser shows up in another browser for the same player', async ({
    page,
    browser,
  }) => {
    const email = uniqueEmail()
    await signUp(page, email)
    const title = await wishlistFromHome(page, 0)

    const otherPage = await newPage(browser)
    await logIn(otherPage, email)
    await openAccountWishlist(otherPage)

    await expect(accountWishlistTitles(otherPage)).toHaveText([title])
  })

  test('removing a game in one browser removes it in another', async ({ page, browser }) => {
    const email = uniqueEmail()
    await signUp(page, email)
    const title = await wishlistFromHome(page, 0)

    const otherPage = await newPage(browser)
    await logIn(otherPage, email)
    await openAccountWishlist(otherPage)
    await expect(accountWishlistTitles(otherPage)).toHaveText([title])

    // Removed in the browser that logged in last: a login replaces the
    // account's one refresh token, so the first browser's session ends on
    // its next page load (User.refreshToken is a single column today).
    await otherPage.getByTestId('wishlist').getByTestId('wishlist-toggle').first().click()
    await expect(otherPage.getByTestId('wishlist-empty')).toBeVisible()
    await otherPage.waitForLoadState('networkidle')

    await logIn(page, email)
    await openAccountWishlist(page)
    await expect(page.getByTestId('wishlist-empty')).toBeVisible()
  })

  test("a guest's wishlist merges into the account on login, without duplicates", async ({ page, browser }) => {
    const email = uniqueEmail()
    await signUp(page, email)
    const savedTitle = await wishlistFromHome(page, 0)
    await logOut(page)

    // As a guest, wishlist the same game again plus a second one.
    await wishlistFromHome(page, 0)
    const guestTitle = await wishlistFromHome(page, 1)
    await logIn(page, email)
    await openAccountWishlist(page)

    // Newest first: the guest's second game, then the one already saved.
    await expect(accountWishlistTitles(page)).toHaveText([guestTitle, savedTitle])

    const otherPage = await newPage(browser)
    await logIn(otherPage, email)
    await openAccountWishlist(otherPage)
    await expect(accountWishlistTitles(otherPage)).toHaveText([guestTitle, savedTitle])
  })

  test('logout clears the wishlist from the browser, and login brings it back', async ({ page }) => {
    const email = uniqueEmail()
    await signUp(page, email)
    const title = await wishlistFromHome(page, 0)

    await logOut(page)
    await page.goto('/')
    await expect(page.getByTestId('card').first().getByRole('button', { name: 'Add to wishlist' })).toBeVisible()

    await logIn(page, email)
    await openAccountWishlist(page)
    await expect(accountWishlistTitles(page)).toHaveText([title])
  })
})
