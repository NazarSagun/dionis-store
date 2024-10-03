'use client'

import { CartAction, CartActionType } from '../actions/cartActions'

export type CartItem = {
  id: number
  thumbnailUrl: string
  title: string
  price: number
  platform: string
  quantity: number
  discount: number
}

export interface CartState {
  items: CartItem[] | []
  currentStep: number
}

export const cartInitialState: CartState = {
  items: [],
  currentStep: 1,
}

export const cartReducer = (state: CartState, action: CartAction) => {
  switch (action.type) {
    case CartActionType.ADD_ITEM:
      return {
        ...state,
        items: [...state.items, action.payload],
      }
    case CartActionType.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      }
    case CartActionType.UPDATE_ITEM_QUANTITY:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ),
      }
    case CartActionType.SET_STEP:
      return {
        ...state,
        currentStep: action.payload.step,
      }

    default:
      return state
  }
}
