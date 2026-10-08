import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuthService } from './auth.service'

describe('AuthService.login', () => {
  let service: AuthService
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } }

  const user = {
    id: 1,
    name: 'Player',
    email: 'player@dionis-store.test',
    role: 101,
    password: bcrypt.hashSync('password123', 10),
  }

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn(), update: jest.fn() } }
    const config = { getOrThrow: (key: string) => `${key}-secret` }

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile()

    service = module.get(AuthService)
  })

  it('logs in with the right password and returns both tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(user)

    const result = await service.login({ email: user.email, password: 'password123' })

    expect(result).toEqual(
      expect.objectContaining({ email: user.email, accessToken: expect.any(String), refreshToken: expect.any(String) }),
    )
  })

  it('gives the same error for an unknown email and for a wrong password', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null)
    const unknownEmail = await service
      .login({ email: 'nobody@dionis-store.test', password: 'password123' })
      .catch((e) => e)

    prisma.user.findUnique.mockResolvedValueOnce(user)
    const wrongPassword = await service.login({ email: user.email, password: 'wrong-password' }).catch((e) => e)

    expect(unknownEmail.message).toBe('Invalid email or password')
    expect(wrongPassword.message).toBe(unknownEmail.message)
    expect(wrongPassword.getStatus?.() ?? wrongPassword.status).toBe(unknownEmail.getStatus?.() ?? unknownEmail.status)
  })
})

describe('AuthService.refreshToken', () => {
  let service: AuthService
  let prisma: { user: { findUnique: jest.Mock; updateMany: jest.Mock } }
  const config = { getOrThrow: (key: string) => `${key}-secret` }
  const email = 'player@dionis-store.test'
  const sign = (jwtid: string) => jwt.sign({ email, role: 101 }, 'REFRESH_TOKEN-secret', { expiresIn: '1d', jwtid })
  const oldToken = sign('old')
  const currentToken = sign('current')
  const baseUser = { id: 1, name: 'Player', email, role: 101 }

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn(), updateMany: jest.fn() } }
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile()
    service = module.get(AuthService)
  })

  it('issues a new refresh token and keeps the old one as the previous token', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, refreshToken: oldToken })
    prisma.user.updateMany.mockResolvedValue({ count: 1 })

    const result = await service.refreshToken(oldToken)

    expect(result.refreshToken).not.toBe(oldToken)
    expect(result.accessToken).toEqual(expect.any(String))
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 1, refreshToken: oldToken },
      data: expect.objectContaining({ refreshToken: result.refreshToken, previousRefreshToken: oldToken }),
    })
  })

  it('accepts the previous token inside the grace window and returns the current token', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...baseUser,
      refreshToken: currentToken,
      previousRefreshToken: oldToken,
      previousRefreshTokenAt: new Date(Date.now() - 5_000),
    })

    const result = await service.refreshToken(oldToken)

    expect(result.refreshToken).toBe(currentToken)
    expect(prisma.user.updateMany).not.toHaveBeenCalled()
  })

  it('rejects the previous token after the grace window', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...baseUser,
      refreshToken: currentToken,
      previousRefreshToken: oldToken,
      previousRefreshTokenAt: new Date(Date.now() - 31_000),
    })

    await expect(service.refreshToken(oldToken)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects an unknown token', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(service.refreshToken(oldToken)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns the winner token when another request rotated the same token first', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ ...baseUser, refreshToken: oldToken })
      .mockResolvedValueOnce({ ...baseUser, refreshToken: currentToken, previousRefreshToken: oldToken })
    prisma.user.updateMany.mockResolvedValue({ count: 0 })

    const result = await service.refreshToken(oldToken)

    expect(result.refreshToken).toBe(currentToken)
  })
})
