/* eslint-disable no-unused-vars */
export enum AuthActionType {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  LOGOUT = 'LOGOUT',
}

export type AuthAction =
  | { type: AuthActionType.LOGIN; payload: string | null | Promise<string | null> }
  | { type: AuthActionType.LOGOUT }
  | { type: AuthActionType.SIGNUP; payload: string | null }
