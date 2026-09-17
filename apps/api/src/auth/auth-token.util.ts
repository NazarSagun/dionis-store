import { Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { Role } from '../common/types/roles'

export interface DecodedToken {
  email: string
  role: Role
}

export function getDecodedDto(email: string, role: Role): DecodedToken {
  return { email, role }
}

export function createAccessToken(payload: DecodedToken, secret: string) {
  return jwt.sign(payload, secret, { expiresIn: '30s' })
}

export function createRefreshToken(payload: DecodedToken, secret: string) {
  return jwt.sign(payload, secret, { expiresIn: '1d' })
}

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
  })
}
