import { expect, test } from '@playwright/test'

test.describe('Auth', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByTestId('email')).toBeVisible()
    await expect(page.getByTestId('password')).toBeVisible()
    await expect(page.getByTestId('submit-button')).toHaveText('Login')
  })

  test('renders the sign up form', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByTestId('name')).toBeVisible()
    await expect(page.getByTestId('email')).toBeVisible()
    await expect(page.getByTestId('password')).toBeVisible()
    await expect(page.getByTestId('submit-button')).toHaveText('Register')
  })

  test('signing up logs the player in and redirects home', async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@dionis-store.test`

    await page.goto('/signup')
    await page.getByTestId('name').fill('E2E Player')
    await page.getByTestId('email').fill(uniqueEmail)
    await page.getByTestId('password').fill('password123')
    await page.getByTestId('submit-button').click()

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Hi, E2E Player')).toBeVisible()
  })
})
