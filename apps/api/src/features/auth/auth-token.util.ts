import { Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { Role } from '../../common/types/roles'

export interface DecodedToken {
  email: string
  role: Role
}

export function getDecodedDto(email: string, role: Role): DecodedToken {
  return { email, role }
}

export function createAccessToken(payload: DecodedToken, secret: string) {
  return jwt.sign(payload, secret, { expiresIn: '15m' })
}

export function createRefreshToken(payload: DecodedToken, secret: string) {
  return jwt.sign(payload, secret, { expiresIn: '1d' })
}

// Browsers drop a Secure cookie that comes from a plain-HTTP origin (localhost
// is the one exception). A deployment without HTTPS sets COOKIE_SECURE=false,
// or the refresh cookie never sticks and every page load logs the user out.
// Without Secure, SameSite=None is not allowed, so it falls back to Lax. That
// works when the web app and the API share one host, because the browser
// compares sites, not ports.
export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  const secure = process.env.COOKIE_SECURE !== 'false'
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  })
}
