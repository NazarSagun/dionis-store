import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import { MailService } from '../../common/mail/mail.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { hashResetToken, PasswordResetService } from './password-reset.service'

describe('PasswordResetService', () => {
  let service: PasswordResetService
  let mail: { sendPasswordReset: jest.Mock }
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock }
    passwordResetToken: {
      deleteMany: jest.Mock
      create: jest.Mock
      updateMany: jest.Mock
      findUniqueOrThrow: jest.Mock
    }
    $transaction: jest.Mock
  }

  beforeEach(async () => {
    mail = { sendPasswordReset: jest.fn().mockResolvedValue(true) }
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      passwordResetToken: {
        deleteMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ userId: 7 }),
      },
      // An array runs as a batch, a callback gets the client as the transaction.
      $transaction: jest.fn((arg) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg))),
    }

    const module = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
      ],
    }).compile()
    service = module.get(PasswordResetService)
  })

  describe('requestReset', () => {
    it('stores only the hash of the emailed token and removes older unused tokens', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 7, email: 'player@dionis-store.test' })

      await service.requestReset('player@dionis-store.test')

      const token = mail.sendPasswordReset.mock.calls[0][1]
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 7, usedAt: null } })
      const { data } = prisma.passwordResetToken.create.mock.calls[0][0]
      expect(data.tokenHash).toBe(hashResetToken(token))
      expect(data.tokenHash).not.toContain(token)
      expect(data.expiresAt.getTime() - Date.now()).toBeGreaterThan(59 * 60 * 1000)
    })

    it('does nothing for an unknown email and does not throw', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.requestReset('nobody@dionis-store.test')).resolves.toBeUndefined()
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled()
      expect(mail.sendPasswordReset).not.toHaveBeenCalled()
    })

    it('does not fail when the email cannot be sent', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 7, email: 'player@dionis-store.test' })
      mail.sendPasswordReset.mockRejectedValue(new Error('SMTP down'))

      await expect(service.requestReset('player@dionis-store.test')).resolves.toBeUndefined()
    })
  })

  describe('resetPassword', () => {
    it('claims an unused, unexpired token, sets the new password, and ends every session', async () => {
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 })

      await service.resetPassword('the-token', 'newpassword456')

      const claim = prisma.passwordResetToken.updateMany.mock.calls[0][0]
      expect(claim.where).toEqual({
        tokenHash: hashResetToken('the-token'),
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      })
      const { where, data } = prisma.user.update.mock.calls[0][0]
      expect(where).toEqual({ id: 7 })
      expect(await bcrypt.compare('newpassword456', data.password)).toBe(true)
      expect(data).toMatchObject({ refreshToken: null, previousRefreshToken: null, previousRefreshTokenAt: null })
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 7, tokenHash: { not: hashResetToken('the-token') } },
      })
    })

    it('rejects a used, expired, or unknown token without changing the password', async () => {
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 })

      await expect(service.resetPassword('used-token', 'newpassword456')).rejects.toThrow(
        'This reset link is invalid or expired',
      )
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })
})
