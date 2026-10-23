import { describe, expect, it } from 'vitest'

import { isPhysicalOrder, ORDER_STATUS_LABELS } from '../domain/formatting'

describe('order status formatting', () => {
  it('labels each status with the badge text', () => {
    expect(ORDER_STATUS_LABELS).toEqual({ PENDING: 'Pending', SHIPPED: 'Shipped', DELIVERED: 'Delivered' })
  })

  it('treats an order with any edition as physical', () => {
    expect(isPhysicalOrder({ items: [{ editionId: null }, { editionId: 3 }] })).toBe(true)
    expect(isPhysicalOrder({ items: [{ editionId: null }] })).toBe(false)
    expect(isPhysicalOrder({})).toBe(false)
  })
})
