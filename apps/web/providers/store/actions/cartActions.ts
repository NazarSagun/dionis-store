import { CartItem } from '../reducers/cartReducer'

export enum CartActionType {
  ADD_ITEM = 'ADD_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  SET_STEP = 'SET_STEP',
  UPDATE_ITEM_QUANTITY = 'UPDATE_ITEM_QUANTITY',
}

export type CartAction =
  | {
      type: CartActionType.ADD_ITEM
      payload: CartItem
    }
  | { type: CartActionType.REMOVE_ITEM; payload: { id: number } }
  | { type: CartActionType.SET_STEP; payload: { step: number } }
  | { type: CartActionType.UPDATE_ITEM_QUANTITY; payload: { id: number; quantity: number } }
