import { APIRequestContext, expect, Page, test } from '@playwright/test'

import { apiToken, apiUrl, logInAsAdmin, logOut, signUpCustomer } from './helpers/admin'
import {
  addDigitalCopyToCart,
  addEditionToCart,
  completePayment,
  fillShippingAddress,
  goToPaymentStep,
} from './helpers/checkout'

// TDD spec for .claude/specs/shipping-status-spec.md. The order status field,
// PATCH /api/admin/orders/:id, and the status UI do not exist yet, so these
// tests fail until phase 4.
// Design: Figma section "Shipping Status (proposal)", node 407-380.
//
// A login replaces the account's one refresh token, so an API login ends the
// browser session of the same account on its next page load. Each test buys
// as a fresh customer in the browser and talks to the API as the admin (a
// different account), or logs in to the API as the customer only after the
// browser is done with that account. The file runs in one worker, in order,
// so an API login as the admin never ends another test's browser admin session.
test.describe.configure({ mode: 'default' })

type Cart = 'physical' | 'digital' | 'mixed'

async function buy(page: Page, cart: Cart) {
  const email = await signUpCustomer(page)
  if (cart !== 'physical') await addDigitalCopyToCart(page)
  if (cart !== 'digital') await addEditionToCart(page, /standard/i)
  await goToPaymentStep(page)
  if (cart !== 'digital') {
    await fillShippingAddress(page, {
      name: 'Alex Doe',
      line1: 'Unter den Linden 1',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Germany',
    })
  }
  await completePayment(page)
  await page.getByTestId('finish-button').click()
  return email
}

// The newest order of a customer, as the admin orders API returns it.
async function latestOrder(request: APIRequestContext, email: string) {
  const token = await apiToken(request)
  const response = await request.get(`${apiUrl}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { email },
  })
  expect(response.ok()).toBe(true)
  const { items } = await response.json()
  expect(items.length).toBeGreaterThan(0)
  return items[0] as {
    id: number
    status: string
    trackingNumber: string | null
  }
}

async function patchOrder(request: APIRequestContext, id: number | string, data: object, token?: string) {
  return request.patch(`${apiUrl}/api/admin/orders/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data,
  })
}

async function openOrderHistory(page: Page) {
  await page.goto('/account')
  await page.getByTestId('account-tab-order-history').click()
  return page.getByTestId('account-order-history').getByTestId('order-history-row').first()
}

async function openAdminOrder(page: Page, email: string) {
  await page.goto('/admin/orders')
  await page.getByTestId('admin-orders-search').fill(email)
  const rows = page.getByTestId('admin-orders-table').getByTestId('admin-order-row')
  await expect(rows).toHaveCount(1)
  return rows.first()
}

test.describe('Feature 1: Order status API', () => {
  test.beforeEach(() => test.setTimeout(90_000))

  test('a physical order starts as PENDING with no tracking number', async ({ page, request }) => {
    const email = await buy(page, 'physical')
    const order = await latestOrder(request, email)

    expect(order.status).toBe('PENDING')
    expect(order.trackingNumber).toBeNull()
  })

  test('a digital-only order starts as DELIVERED', async ({ page, request }) => {
    const email = await buy(page, 'digital')

    expect((await latestOrder(request, email)).status).toBe('DELIVERED')
  })

  test('a mixed order starts as PENDING', async ({ page, request }) => {
    const email = await buy(page, 'mixed')

    expect((await latestOrder(request, email)).status).toBe('PENDING')
  })

  test('an admin sets the status and tracking number, and the buyer sees them', async ({ page, request }) => {
    const email = await buy(page, 'physical')
    const { id } = await latestOrder(request, email)
    const token = await apiToken(request)

    const shipped = await patchOrder(request, id, { status: 'SHIPPED', trackingNumber: ' TRK123 ' }, token)
    expect(shipped.status()).toBe(200)
    expect(await shipped.json()).toMatchObject({
      id,
      status: 'SHIPPED',
      trackingNumber: 'TRK123',
    })

    const buyerToken = await apiToken(request, email, 'password123')
    const buyerOrders = await (
      await request.get(`${apiUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      })
    ).json()
    expect(buyerOrders.items[0]).toMatchObject({
      id,
      status: 'SHIPPED',
      trackingNumber: 'TRK123',
    })

    const delivered = await patchOrder(request, id, { status: 'DELIVERED' }, token)
    expect(await delivered.json()).toMatchObject({
      status: 'DELIVERED',
      trackingNumber: 'TRK123',
    })

    const cleared = await patchOrder(request, id, { status: 'DELIVERED', trackingNumber: '' }, token)
    expect((await cleared.json()).trackingNumber).toBeNull()
  })

  test('a regular user gets 403 and a request without a token gets 401', async ({ page, request }) => {
    const email = await buy(page, 'physical')
    const { id } = await latestOrder(request, email)
    const userToken = await apiToken(request, email, 'password123')

    expect((await patchOrder(request, id, { status: 'SHIPPED' }, userToken)).status()).toBe(403)
    expect((await patchOrder(request, id, { status: 'SHIPPED' })).status()).toBe(401)
  })

  test('rejects an invalid status, a long tracking number, a bad id, and a digital-only order', async ({
    page,
    request,
  }) => {
    const email = await buy(page, 'physical')
    const { id } = await latestOrder(request, email)
    const token = await apiToken(request)

    expect((await patchOrder(request, id, { status: 'LOST' }, token)).status()).toBe(400)
    expect((await patchOrder(request, id, { status: 'SHIPPED', trackingNumber: 'x'.repeat(65) }, token)).status()).toBe(
      400,
    )
    expect((await patchOrder(request, 'abc', { status: 'SHIPPED' }, token)).status()).toBe(400)
    expect((await patchOrder(request, 2_000_000_000, { status: 'SHIPPED' }, token)).status()).toBe(404)

    await logOut(page)
    const digitalEmail = await buy(page, 'digital')
    const digital = await latestOrder(request, digitalEmail)
    expect((await patchOrder(request, digital.id, { status: 'SHIPPED' }, token)).status()).toBe(400)
  })
})

test.describe('Feature 2: Status controls in the admin panel', () => {
  test.beforeEach(() => test.setTimeout(90_000))

  test('every order row shows a status badge', async ({ page }) => {
    await logInAsAdmin(page)
    await page.goto('/admin/orders')
    const rows = page.getByTestId('admin-orders-table').getByTestId('admin-order-row')
    await expect(rows.first()).toBeVisible()

    const count = await rows.count()
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByTestId('admin-order-status')).toHaveText(/^(Pending|Shipped|Delivered)$/)
    }
  })

  test('an admin ships a pending physical order and the values survive a reload', async ({ page }) => {
    const email = await buy(page, 'physical')
    await logOut(page)
    await logInAsAdmin(page)

    const row = await openAdminOrder(page, email)
    await expect(row.getByTestId('admin-order-status')).toHaveText('Pending')
    await row.getByTestId('admin-order-toggle').click()
    const shipment = page.getByTestId('admin-order-shipment')
    await shipment.getByTestId('admin-order-status-select').selectOption({ label: 'Shipped' })
    await shipment.getByTestId('admin-order-tracking-input').fill('TRK123')
    await shipment.getByTestId('admin-order-shipment-save').click()

    await expect(row.getByTestId('admin-order-status')).toHaveText('Shipped')

    const reloaded = await openAdminOrder(page, email)
    await reloaded.getByTestId('admin-order-toggle').click()
    await expect(page.getByTestId('admin-order-status-select')).toHaveValue('SHIPPED')
    await expect(page.getByTestId('admin-order-tracking-input')).toHaveValue('TRK123')
  })

  test('a digital-only order has no shipment controls and shows Delivered', async ({ page }) => {
    const email = await buy(page, 'digital')
    await logOut(page)
    await logInAsAdmin(page)

    const row = await openAdminOrder(page, email)
    await expect(row.getByTestId('admin-order-status')).toHaveText('Delivered')
    await row.getByTestId('admin-order-toggle').click()
    await expect(page.getByTestId('admin-order-items')).toBeVisible()
    await expect(page.getByTestId('admin-order-shipment')).toHaveCount(0)
    await expect(page.getByTestId('admin-order-status-select')).toHaveCount(0)
  })

  test('a failed save shows an error and keeps the entered values', async ({ page }) => {
    const email = await buy(page, 'physical')
    await logOut(page)
    await logInAsAdmin(page)
    await page.route('**/api/admin/orders/*', (route) =>
      route.request().method() === 'PATCH'
        ? route.fulfill({
            status: 500,
            json: { message: 'Internal server error' },
          })
        : route.continue(),
    )

    const row = await openAdminOrder(page, email)
    await row.getByTestId('admin-order-toggle').click()
    const shipment = page.getByTestId('admin-order-shipment')
    await shipment.getByTestId('admin-order-status-select').selectOption({ label: 'Shipped' })
    await shipment.getByTestId('admin-order-tracking-input').fill('TRK123')
    await shipment.getByTestId('admin-order-shipment-save').click()

    await expect(shipment.getByTestId('admin-order-shipment-error')).toBeVisible()
    await expect(shipment.getByTestId('admin-order-status-select')).toHaveValue('SHIPPED')
    await expect(shipment.getByTestId('admin-order-tracking-input')).toHaveValue('TRK123')
    await expect(row.getByTestId('admin-order-status')).toHaveText('Pending')
  })
})

test.describe('Feature 3: Status in Order History', () => {
  test.beforeEach(() => test.setTimeout(90_000))

  test('a pending order shows Pending, then Shipped with its tracking number after the admin ships it', async ({
    page,
    request,
  }) => {
    const email = await buy(page, 'physical')

    const row = await openOrderHistory(page)
    await expect(row.getByTestId('order-history-status')).toHaveText('Pending')

    const { id } = await latestOrder(request, email)
    const shipped = await patchOrder(
      request,
      id,
      { status: 'SHIPPED', trackingNumber: 'TRK123' },
      await apiToken(request),
    )
    expect(shipped.status()).toBe(200)

    const reloaded = await openOrderHistory(page)
    await expect(reloaded.getByTestId('order-history-status')).toHaveText('Shipped')
    await reloaded.getByTestId('order-history-toggle').click()
    await expect(reloaded.getByTestId('order-history-tracking')).toHaveText('Tracking number: TRK123')
  })

  test('a digital-only order shows no status badge', async ({ page }) => {
    await buy(page, 'digital')

    const row = await openOrderHistory(page)
    await expect(row).toBeVisible()
    await expect(row.getByTestId('order-history-status')).toHaveCount(0)
  })

  test('a physical order with no tracking number shows no tracking line', async ({ page }) => {
    await buy(page, 'physical')

    const row = await openOrderHistory(page)
    await row.getByTestId('order-history-toggle').click()
    await expect(row.getByTestId('order-history-status')).toHaveText('Pending')
    await expect(row.getByTestId('order-history-tracking')).toHaveCount(0)
  })
})
