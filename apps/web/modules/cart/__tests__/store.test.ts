import { beforeEach, describe, expect, it } from 'vitest'

import { useCartStore } from '../core/store'

const mockItem = {
  id: 1,
  editionId: null,
  thumbnailUrl: 'test',
  title: 'title',
  price: 23,
  platform: 'PC',
  quantity: 1,
  discount: 0,
}

const mockEditionItem = {
  ...mockItem,
  editionId: 10,
  editionName: 'Standard Physical Edition',
  price: 33,
}

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], currentStep: 1 })
  })

  it('Should add item to the cart correctly', () => {
    useCartStore.getState().addItem(mockItem)

    expect(useCartStore.getState().items).toStrictEqual([mockItem])
  })

  it('Should remove item from the cart correctly', () => {
    useCartStore.setState({ items: [mockItem] })

    useCartStore.getState().removeItem(1, null)

    expect(useCartStore.getState().items).toStrictEqual([])
  })

  it('Should update item quantity in the cart correctly', () => {
    useCartStore.setState({ items: [mockItem] })

    useCartStore.getState().updateItemQuantity(1, null, 2)

    expect(useCartStore.getState().items).toStrictEqual([{ ...mockItem, quantity: 2 }])
  })

  it('Should update current step in the cart correctly', () => {
    useCartStore.getState().setStep(2)

    expect(useCartStore.getState().currentStep).toBe(2)
  })

  it('keeps a digital line and a physical edition line of the same game separate', () => {
    useCartStore.setState({ items: [mockItem, mockEditionItem] })

    useCartStore.getState().removeItem(1, 10)

    expect(useCartStore.getState().items).toStrictEqual([mockItem])
  })

  it('updates only the matching line when a game has both a digital and a physical line', () => {
    useCartStore.setState({ items: [mockItem, mockEditionItem] })

    useCartStore.getState().updateItemQuantity(1, 10, 3)

    expect(useCartStore.getState().items).toStrictEqual([mockItem, { ...mockEditionItem, quantity: 3 }])
  })
})
