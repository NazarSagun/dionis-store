/* eslint-disable no-unused-vars */
export enum AuthActionType {
  AUTHENTICATE = 'AUTHENTICATE',
  LOGOUT = 'LOGOUT',
}

export type AuthAction =
  | { type: AuthActionType.AUTHENTICATE; payload: string | null | Promise<string | null> }
  | { type: AuthActionType.LOGOUT }
