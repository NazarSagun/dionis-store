import { AuthAction } from '../actions/authActions'
import { ActionType } from '../types'

import { authInitialState, authReducer, AuthState } from './authReducer'

export type GlobalState = {
  auth: AuthState
}

export const globalInitialState: GlobalState = {
  auth: authInitialState,
}

export const rootReducer = (state: GlobalState, action: ActionType): GlobalState => {
  return {
    auth: authReducer(state.auth, action as AuthAction),
  }
}
