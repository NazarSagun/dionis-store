/* eslint-disable no-unused-vars */
export enum AuthActionType {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  LOGOUT = 'LOGOUT',
}

export type AuthAction =
  | { type: AuthActionType.LOGIN; payload: AuthPayload }
  | { type: AuthActionType.LOGOUT }
  | { type: AuthActionType.SIGNUP; payload: AuthPayload }

export interface AuthPayload {
  email: string
  password: string
}
