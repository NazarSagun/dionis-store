'use client'

import { AuthAction, AuthActionType } from '../actions/authActions'

export interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null | Promise<string | null>
}

export const authInitialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
}

export const authReducer = (state: AuthState, action: AuthAction) => {
  switch (action.type) {
    case AuthActionType.AUTHENTICATE:
      localStorage.setItem('token', action.payload as string)
      return {
        ...state,
        isAuthenticated: true,
        accessToken: action.payload,
      }
    case AuthActionType.LOGOUT:
      localStorage.removeItem('token')
      return {
        ...state,
        isAuthenticated: false,
        accessToken: null,
      }
    default:
      return state
  }
}
