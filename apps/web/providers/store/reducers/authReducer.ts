'use client'

import { AuthAction, AuthActionType } from '../actions/authActions'

type User = {
  name: string
}

export interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null | Promise<string | null>
  user: User | null
}

export const authInitialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  user: null,
}

export const authReducer = (state: AuthState, action: AuthAction) => {
  switch (action.type) {
    case AuthActionType.AUTHENTICATE:
      localStorage.setItem('token', action.payload.token as string)
      return {
        ...state,
        isAuthenticated: true,
        accessToken: action.payload.token,
        user: {
          name: action.payload.name,
        },
      }
    case AuthActionType.LOGOUT:
      localStorage.removeItem('token')
      return {
        ...state,
        isAuthenticated: false,
        accessToken: null,
        user: null,
      }
    default:
      return state
  }
}
