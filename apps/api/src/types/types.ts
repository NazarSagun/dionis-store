import { Request } from 'express'

export interface AuthInfoRequest extends Request {
  email: string
  role: Role
}

export enum Roles {
  User = 101,
  Editor = 233,
  Admin = 500,
}

export type Role = Roles.User | Roles.Admin | Roles.Editor

export interface User {
  id?: number
  name?: string
  email: string
  refreshToken?: string
  accessToken?: string
  role?: Role
  password: string
  createdAt?: Date
}

export interface DecodedProperty {
  email: string
  role: Role
}
