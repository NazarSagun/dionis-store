import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { PrismaService } from '../common/prisma/prisma.service'
import { CustomError } from '../common/errors/custom-error'
import { Role, Roles } from '../common/types/roles'
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

    const hashedPassword = bcrypt.hashSync(password, 10)
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
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password)
    if (!isPasswordValid) {
      throw new CustomError('Invalid password', 400)
    }

    const role = user.role as Role
    const accessToken = createAccessToken(getDecodedDto(email, role), this.accessTokenSecret)
    const refreshToken = createRefreshToken(getDecodedDto(email, role), this.refreshTokenSecret)

    await this.prisma.user.update({ where: { email }, data: { refreshToken } })

    return { accessToken, refreshToken, name: user.name, email: user.email, role }
  }

  async logout(refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { refreshToken } })
    if (!user) {
      throw new CustomError('Bad request!', 400)
    }

    await this.prisma.user.update({ where: { refreshToken }, data: { refreshToken: null } })
  }

  async refreshToken(refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { refreshToken } })
    if (!user) {
      throw new CustomError('Bad request', 400)
    }

    return new Promise((resolve, reject) => {
      jwt.verify(refreshToken, this.refreshTokenSecret, (err, decoded) => {
        if (err) {
          reject(new CustomError('Authentication error. Refresh token expired, please login to have access', 401))
          return
        }

        const role = user.role as Role
        const accessToken = createAccessToken(
          getDecodedDto((decoded as { email: string }).email, role),
          this.accessTokenSecret,
        )

        resolve({ email: user.email, name: user.name, accessToken, role })
      })
    })
  }
}
