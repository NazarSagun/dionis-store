export enum Roles {
  User = 101,
  Editor = 233,
  Admin = 500,
}

export type Role = Roles.User | Roles.Admin | Roles.Editor

export interface AuthenticatedUser {
  email: string
  role: Role
}
