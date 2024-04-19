import { PrismaClient } from '@prisma/client'
import { User } from '../types'
import { CustomError } from '../middleware'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { createAccessToken, createRefreshToken, getDecodedDto } from '../helpers'

dotenv.config()

export class AuthService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async register(userData: User) {
    const { name, email, password } = userData
    const userExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })
    if (userExists) {
      throw new CustomError('User already exists!', 400)
    }

    const hashedPassword = bcrypt.hashSync(password, 10)

    const accessToken = createAccessToken(getDecodedDto(email), '30s')
    const refreshToken = createRefreshToken(email, '1d') 

    await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        refreshToken
      },
    })

    return { accessToken, refreshToken }
  }

  async login(credentials: User) {
    const { email, password } = credentials

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      throw new CustomError('User does not exist!', 400)
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password)

    if (!isPasswordValid) {
      throw new CustomError('Invalid password!', 400)
    }
    const accessToken = createAccessToken(getDecodedDto(email, user.role), '30m')
    const refreshToken = createRefreshToken(email, '1d')

    await this.prisma.user.update({
      where: {
        email,
      },
      data: {
        refreshToken,
      },
    })

    return { accessToken, refreshToken }
  }

  async logout(refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        refreshToken,
      },
    })

    if (!user) {
      throw new CustomError('Bad request!', 400)
    }

    await this.prisma.user.update({
      where: {
        refreshToken,
      },
      data: {
        refreshToken: null,
      },
    })
  }

  async refreshToken(refreshToken: string) {
    const user: User = await this.prisma.user.findUnique({
      where: {
        refreshToken,
      },
    })

    if (!user) {
      throw new CustomError('Bad request!', 400)
    }

    const verifiedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
      if (err) {
        throw new CustomError('Forbidden', 403)
      }
      
      const accessToken = createAccessToken(getDecodedDto(decoded.email, user.role), '30s')

      return accessToken
    })

    return { accessToken: verifiedToken }
  }
}
