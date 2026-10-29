import { APIRequestContext, expect, test } from '@playwright/test'

import { apiUrl } from './helpers/admin'
import { waitForReceipts } from './helpers/mail'
import { PASSWORD as OLD_PASSWORD, registerViaApi } from './helpers/reviews'

// TDD spec for password-reset-spec.md. The forgot-password and reset-password
// routes and pages do not exist yet, so these tests fail until phase 4. The API
// must run with SMTP_HOST pointing at Mailpit. Design: the "Auth" section and
// "Email — Password reset (600)" in the Figma file.

const NEW_PASSWORD = 'newpassword456'

// The link points at the web app, so only its path and query are kept.
async function readResetLink(request: APIRequestContext, email: string) {
  const [message] = await waitForReceipts(request, email)
  expect(message.Subject).toBe('Reset your Dionis Store password')
  const match = message.Text.match(/\/reset-password\?token=[A-Za-z0-9_-]+/)
  expect(match).not.toBeNull()
  return match![0]
}

test.describe('Password reset', () => {
  test('a user asks for a link, sets a new password, and logs in with it', async ({ page, request }) => {
    const email = await registerViaApi(request)

    await page.goto('/login')
    await page.getByTestId('forgot-password-link').click()
    await expect(page).toHaveURL('/forgot-password')

    await page.getByTestId('forgot-email').fill(email)
    await page.getByTestId('forgot-submit').click()
    await expect(page.getByTestId('forgot-sent')).toBeVisible()

    await page.goto(await readResetLink(request, email))
    await page.getByTestId('reset-password').fill(NEW_PASSWORD)
    await page.getByTestId('reset-confirm').fill(NEW_PASSWORD)
    await page.getByTestId('reset-submit').click()

    await expect(page).toHaveURL('/login')
    await expect(page.getByText('Password changed').first()).toBeVisible()

    await page.getByTestId('email').fill(email)
    await page.getByTestId('password').fill(NEW_PASSWORD)
    await page.getByTestId('submit-button').click()
    await expect(page).toHaveURL('/')
  })

  test('the API replaces the password, so only the new one logs in', async ({ request }) => {
    const email = await registerViaApi(request)

    const forgot = await request.post(`${apiUrl}/api/forgot-password`, { data: { email } })
    expect(forgot.status()).toBe(204)

    const token = new URL(await readResetLink(request, email), 'http://web.test').searchParams.get('token')
    const reset = await request.post(`${apiUrl}/api/reset-password`, { data: { token, password: NEW_PASSWORD } })
    expect(reset.status()).toBe(204)

    const oldLogin = await request.post(`${apiUrl}/api/login`, { data: { email, password: OLD_PASSWORD } })
    expect(oldLogin.status()).toBe(400)
    const newLogin = await request.post(`${apiUrl}/api/login`, { data: { email, password: NEW_PASSWORD } })
    expect(newLogin.status()).toBe(201)
  })
})
