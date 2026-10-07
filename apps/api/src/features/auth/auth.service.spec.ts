import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
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
