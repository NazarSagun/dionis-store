import { Injectable, Logger } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { MailService } from '../../common/mail/mail.service'
import { CustomError } from '../../common/errors/custom-error'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

// The token has 256 random bits, so a fast unsalted hash is enough. Only the
// hash is stored, so a database leak does not leak working links.
export const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex')

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // Returns the same way for an unknown email, so the caller cannot tell
  // which addresses have an account.
  async requestReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) return

    const token = randomBytes(32).toString('base64url')
    // Only the newest link works.
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      }),
    ])

    // Not awaited, so a known email answers about as fast as an unknown one.
    this.mail
      .sendPasswordReset(user.email, token)
      .catch((error) => this.logger.error(`Password reset email for user ${user.id} failed: ${error}`))
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = hashResetToken(token)
    const hashedPassword = await bcrypt.hash(password, 10)
    const now = new Date()

    await this.prisma.$transaction(async (tx) => {
      // The where clause makes the claim atomic, so one token cannot be used twice.
      const { count } = await tx.passwordResetToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      })
      if (count !== 1) throw new CustomError('This reset link is invalid or expired', 400)

      const { userId } = await tx.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } })
      // Clearing the refresh tokens ends every old session.
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          refreshToken: null,
          previousRefreshToken: null,
          previousRefreshTokenAt: null,
        },
      })
      await tx.passwordResetToken.deleteMany({ where: { userId, tokenHash: { not: tokenHash } } })
    })
  }
}
