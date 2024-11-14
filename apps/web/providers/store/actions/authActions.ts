export enum AuthActionType {
  AUTHENTICATE = 'AUTHENTICATE',
  LOGOUT = 'LOGOUT',
}

export type AuthAction =
  | { type: AuthActionType.AUTHENTICATE; payload: { token: string | null | Promise<string | null>; name: string } }
  | { type: AuthActionType.LOGOUT }
