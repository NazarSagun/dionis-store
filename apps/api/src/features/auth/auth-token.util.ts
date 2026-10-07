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
// SameSite=Strict keeps the browser from sending the cookie on any request that
// another site starts, which also stops a cross-site page from calling
// GET /logout. The web app and the API share one site, so its own requests still
// carry the cookie.
export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  const secure = process.env.COOKIE_SECURE !== 'false'
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  })
}
