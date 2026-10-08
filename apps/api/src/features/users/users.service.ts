import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { Role } from '../../common/types/roles'
import { createRefreshToken, getDecodedDto } from '../auth/auth-token.util'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
  }

  async updateName(email: string, name: string) {
    const userExists = await this.prisma.user.findUnique({ where: { email } })
    if (!userExists) {
      throw new CustomError('User does not exist', 400)
    }

    const updated = await this.prisma.user.update({ where: { email }, data: { name } })
    return { name: updated.name }
  }

  async changePassword(email: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new CustomError('Current password is incorrect', 400)
    }

    // A new refresh token replaces the stored one, so a token stolen before
    // the change stops working. The caller sets it as this session's cookie.
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const refreshToken = createRefreshToken(
      getDecodedDto(email, user.role as Role),
      this.configService.getOrThrow<string>('REFRESH_TOKEN'),
    )
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword, refreshToken, previousRefreshToken: null, previousRefreshTokenAt: null },
    })
    return { refreshToken }
  }

  async remove(id: number) {
    const userExists = await this.prisma.user.findUnique({ where: { id } })
    if (!userExists) {
      throw new CustomError('There is no such user', 400)
    }

    await this.prisma.user.delete({ where: { id } })
  }
}
