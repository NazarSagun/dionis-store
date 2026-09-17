import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '../useCartStore'

const mockItem = { id: 1, thumbnailUrl: 'test', title: 'title', price: 23, platform: 'PC', quantity: 1, discount: 0 }

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

    useCartStore.getState().removeItem(1)

    expect(useCartStore.getState().items).toStrictEqual([])
  })

  it('Should update item quantity in the cart correctly', () => {
    useCartStore.setState({ items: [mockItem] })

    useCartStore.getState().updateItemQuantity(1, 2)

    expect(useCartStore.getState().items).toStrictEqual([{ ...mockItem, quantity: 2 }])
  })

  it('Should update current step in the cart correctly', () => {
    useCartStore.getState().setStep(2)

    expect(useCartStore.getState().currentStep).toBe(2)
  })
})
