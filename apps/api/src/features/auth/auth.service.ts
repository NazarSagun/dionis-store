import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { Role, Roles } from '../../common/types/roles'
import { createAccessToken, createRefreshToken, getDecodedDto } from './auth-token.util'

interface RegisterInput {
  name: string
  email: string
  password: string
}

interface LoginInput {
  email: string
  password: string
}

// How long the previous refresh token keeps working after a rotation.
const REFRESH_GRACE_MS = 30_000

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-password', 10)

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private get accessTokenSecret() {
    return this.configService.getOrThrow<string>('ACCESS_TOKEN')
  }

  private get refreshTokenSecret() {
    return this.configService.getOrThrow<string>('REFRESH_TOKEN')
  }

  async register({ name, email, password }: RegisterInput) {
    const userExists = await this.prisma.user.findUnique({ where: { email } })
    if (userExists) {
      throw new CustomError('User already exists!', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const role: Role = Roles.User

    const accessToken = createAccessToken(getDecodedDto(email, role), this.accessTokenSecret)
    const refreshToken = createRefreshToken(getDecodedDto(email, role), this.refreshTokenSecret)

    await this.prisma.user.create({
      data: { name, email, password: hashedPassword, refreshToken, role },
    })

    return { accessToken, refreshToken, name, email, role }
  }

  async login({ email, password }: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    // One message for an unknown email and a wrong password, so the response
    // does not tell a stranger which emails have an account.
    // Compared against a dummy hash for an unknown email, so both cases take the
    // same time.
    const isPasswordValid = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH)
    if (!user || !isPasswordValid) {
      throw new CustomError('Invalid email or password', 400)
    }

    const role = user.role as Role
    const accessToken = createAccessToken(getDecodedDto(email, role), this.accessTokenSecret)
    const refreshToken = createRefreshToken(getDecodedDto(email, role), this.refreshTokenSecret)

    await this.prisma.user.update({
      where: { email },
      data: { refreshToken, previousRefreshToken: null, previousRefreshTokenAt: null },
    })

    return { accessToken, refreshToken, name: user.name, email: user.email, role }
  }

  async logout(refreshToken: string) {
    const user = await this.findByRefreshToken(refreshToken)
    if (!user) {
      throw new CustomError('Bad request!', 400)
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null, previousRefreshToken: null, previousRefreshTokenAt: null },
    })
  }

  private findByRefreshToken(token: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ refreshToken: token }, { previousRefreshToken: token }] },
    })
  }

  // Every call issues a new refresh token. The previous one stays valid for
  // REFRESH_GRACE_MS, so two tabs that refresh together do not log each other
  // out. After that window, the old token is rejected.
  // ponytail: no reuse detection. A replay of an old token is only rejected,
  // it does not revoke the session. Add that if token theft becomes a real risk.
  async refreshToken(refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { refreshToken } })
    if (user) {
      this.verifyRefreshToken(refreshToken)
      return this.rotate(user, refreshToken)
    }

    const previousUser = await this.prisma.user.findUnique({ where: { previousRefreshToken: refreshToken } })
    const age = previousUser?.previousRefreshTokenAt
      ? Date.now() - previousUser.previousRefreshTokenAt.getTime()
      : Infinity
    if (!previousUser?.refreshToken || age > REFRESH_GRACE_MS) {
      throw new CustomError('Bad request', 400)
    }

    this.verifyRefreshToken(refreshToken)
    return this.buildResult(previousUser, previousUser.refreshToken)
  }

  private async rotate(user: User, oldToken: string) {
    const role = user.role as Role
    const newToken = createRefreshToken(getDecodedDto(user.email, role), this.refreshTokenSecret)

    // The where clause makes the swap atomic. If another request rotated the
    // same token first, this one returns the token that request stored.
    const { count } = await this.prisma.user.updateMany({
      where: { id: user.id, refreshToken: oldToken },
      data: { refreshToken: newToken, previousRefreshToken: oldToken, previousRefreshTokenAt: new Date() },
    })
    if (count === 1) return this.buildResult(user, newToken)

    const current = await this.prisma.user.findUnique({ where: { id: user.id } })
    if (!current?.refreshToken || current.previousRefreshToken !== oldToken) {
      throw new CustomError('Bad request', 400)
    }
    return this.buildResult(current, current.refreshToken)
  }

  private verifyRefreshToken(token: string) {
    try {
      jwt.verify(token, this.refreshTokenSecret)
    } catch {
      throw new CustomError('Authentication error. Refresh token expired, please login to have access', 401)
    }
  }

  private buildResult(user: User, refreshToken: string) {
    const role = user.role as Role
    const accessToken = createAccessToken(getDecodedDto(user.email, role), this.accessTokenSecret)
    return { email: user.email, name: user.name, accessToken, role, refreshToken }
  }
}
