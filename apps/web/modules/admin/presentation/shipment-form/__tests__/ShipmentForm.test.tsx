import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, waitFor } from '@/test-utils/utils'

import { AdminOrderObject } from '../../../integration/repository'
import { ShipmentForm } from '../ShipmentForm'

const TIMEOUT = 3000

const order = {
  id: 7,
  totalPrice: 5800,
  status: 'PENDING',
  trackingNumber: null,
  items: [{ id: 1, editionId: 10 }],
  user: { email: 'buyer@dionis-store.test' },
} as AdminOrderObject

describe('<ShipmentForm />', () => {
  it('starts with the stored values and sends the selected status and tracking number', async () => {
    let body: unknown
    serviceWorker.use(
      http.patch('*/admin/orders/7', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...order, status: 'SHIPPED', trackingNumber: 'TRK123' })
      }),
    )

    render(<ShipmentForm order={order} />)
    expect(screen.getByTestId('admin-order-status-select')).toHaveValue('PENDING')
    expect(screen.getByTestId('admin-order-tracking-input')).toHaveValue('')

    await userEvent.selectOptions(screen.getByTestId('admin-order-status-select'), 'Shipped')
    await userEvent.type(screen.getByTestId('admin-order-tracking-input'), 'TRK123')
    await userEvent.click(screen.getByTestId('admin-order-shipment-save'))

    await waitFor(() => expect(body).toEqual({ status: 'SHIPPED', trackingNumber: 'TRK123' }), { timeout: TIMEOUT })
    expect(screen.queryByTestId('admin-order-shipment-error')).not.toBeInTheDocument()
  })

  it('shows an error and keeps the entered values when the save fails', async () => {
    serviceWorker.use(http.patch('*/admin/orders/7', () => HttpResponse.json({}, { status: 500 })))

    render(<ShipmentForm order={order} />)
    await userEvent.selectOptions(screen.getByTestId('admin-order-status-select'), 'Delivered')
    await userEvent.type(screen.getByTestId('admin-order-tracking-input'), 'TRK9')
    await userEvent.click(screen.getByTestId('admin-order-shipment-save'))

    expect(await screen.findByTestId('admin-order-shipment-error', {}, { timeout: TIMEOUT })).toHaveTextContent(
      'Could not save the shipment. Please try again.',
    )
    expect(screen.getByTestId('admin-order-status-select')).toHaveValue('DELIVERED')
    expect(screen.getByTestId('admin-order-tracking-input')).toHaveValue('TRK9')
  })
})
