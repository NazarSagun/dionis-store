import { ThemeAction } from '../actions'
import { AuthAction } from '../actions/authActions'
import { ActionType } from '../types'

import { authInitialState, authReducer, AuthState } from './authReducer'
import { themeInitialState, themeReducer, ThemeState } from './themeReducer'

export type GlobalState = {
  auth: AuthState
  theme: ThemeState
}

export const globalInitialState: GlobalState = {
  auth: authInitialState,
  theme: themeInitialState,
}

export const rootReducer = (state: GlobalState, action: ActionType): GlobalState => {
  return {
    auth: authReducer(state.auth, action as AuthAction),
    theme: themeReducer(state.theme, action as ThemeAction),
  }
}
