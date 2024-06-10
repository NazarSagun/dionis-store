import { AuthAction, AuthActionType } from '../actions/authActions'

export interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
}

export const authInitialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
}

export const authReducer = (state: AuthState, action: AuthAction) => {
  switch (action.type) {
    case AuthActionType.LOGIN:
      return {
        ...state,
        auth: { isAuthenticated: true, accessToken: action.payload },
      }
    case AuthActionType.LOGOUT:
      return {
        ...state,
        auth: { isAuthenticated: false, accessToken: null },
      }
    case AuthActionType.SIGNUP:
      return {
        ...state,
        auth: { isAuthenticated: true, accessToken: action.payload },
      }
    default:
      return state
  }
}
