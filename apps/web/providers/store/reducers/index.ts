import { AuthAction } from '../actions/authActions'
import { CartAction } from '../actions/cartActions'
import { ActionType } from '../types'

import { authInitialState, authReducer, AuthState } from './authReducer'
import { cartInitialState, cartReducer, CartState } from './cartReducer'

export type GlobalState = {
  auth: AuthState
  cart: CartState
}

export const globalInitialState: GlobalState = {
  auth: authInitialState,
  cart: cartInitialState,
}

export const rootReducer = (state: GlobalState, action: ActionType): GlobalState => {
  return {
    auth: authReducer(state.auth, action as AuthAction),
    cart: cartReducer(state.cart, action as CartAction),
  }
}
