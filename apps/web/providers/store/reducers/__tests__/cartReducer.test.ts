import { expect, describe, it } from 'vitest'
import { cartReducer, CartState } from '../cartReducer'
import { CartActionType } from '../../actions'

const mockData = { id: 1, thumbnailUrl: 'test', title: 'title', price: 23, platform: 'PC', quantity: 1 }

describe('Cart reducer', () => {
  it('Should add item to the cart correctly', () => {
    const expectedResult: CartState = { items: [mockData], currentStep: 1 }
    const output = cartReducer({ items: [], currentStep: 1 }, { type: CartActionType.ADD_ITEM, payload: mockData })

    expect(output).toStrictEqual(expectedResult)
  })

  it('Should remove item from the cart correctly', () => {
    const expectedResult: CartState = { items: [], currentStep: 1 }
    const output = cartReducer(
      { items: [mockData], currentStep: 1 },
      { type: CartActionType.REMOVE_ITEM, payload: { id: 1 } }
    )

    expect(output).toStrictEqual(expectedResult)
  })

  it('Should update item in the cart correctly', () => {
    const expectedResult: CartState = { items: [{ ...mockData, quantity: 2 }], currentStep: 1 }
    const output = cartReducer(
      { items: [mockData], currentStep: 1 },
      { type: CartActionType.UPDATE_ITEM_QUANTITY, payload: { id: 1, quantity: 2 } }
    )

    expect(output).toStrictEqual(expectedResult)
  })

  it('Should update current step in the cart correctly', () => {
    const expectedResult: CartState = { items: [mockData], currentStep: 2 }
    const output = cartReducer(
      { items: [mockData], currentStep: 1 },
      { type: CartActionType.SET_STEP, payload: { step: 2 } }
    )

    expect(output).toStrictEqual(expectedResult)
  })
})
