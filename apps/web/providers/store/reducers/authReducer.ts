import { AuthAction, AuthActionType } from '../actions/authActions'

export interface AuthState {
  isAuthenticated: boolean
  user: { email: string; password: string } | null
}

export const authInitialState: AuthState = {
  user: null,
  isAuthenticated: false,
}

export const authReducer = (state: AuthState, action: AuthAction) => {
  switch (action.type) {
    case AuthActionType.LOGIN:
      return {
        ...state,
        auth: { isAuthenticated: true, user: action.payload },
      }
    case AuthActionType.LOGOUT:
      return {
        ...state,
        auth: { isAuthenticated: false, user: null },
      }
    case AuthActionType.SIGNUP:
      return {
        ...state,
        auth: { isAuthenticated: true, user: action.payload },
      }
    default:
      return state
  }
}
