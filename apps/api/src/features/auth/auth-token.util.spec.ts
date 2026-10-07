import { Response } from 'express'
import { setRefreshTokenCookie } from './auth-token.util'

describe('setRefreshTokenCookie', () => {
  const originalEnv = process.env
  const res = { cookie: jest.fn() } as unknown as Response

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.COOKIE_SECURE
    ;(res.cookie as jest.Mock).mockReset()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('sets a Secure, SameSite=None cookie by default', () => {
    setRefreshTokenCookie(res, 'token')

    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'token',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'none', maxAge: 86_400_000 }),
    )
  })

  it('sets a non-Secure, SameSite=Lax cookie when COOKIE_SECURE is false, for a deployment without HTTPS', () => {
    process.env.COOKIE_SECURE = 'false'

    setRefreshTokenCookie(res, 'token')

    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'token',
      expect.objectContaining({ httpOnly: true, secure: false, sameSite: 'lax' }),
    )
  })
})
