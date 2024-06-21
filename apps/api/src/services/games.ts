import { PrismaClient } from '@prisma/client'
import { User } from '../types'
import { CustomError } from '../middleware'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { createAccessToken, createRefreshToken, getDecodedDto } from '../helpers'
import { CLIENT_RENEG_LIMIT } from 'tls'

dotenv.config()

export class GamesService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async fetchGames(data: { page: number }) {
    const limit = 20
    const page: number = data.page || 1

    const games = await this.prisma.game_pc.findMany({
      skip: (page - 1) * limit,
      take: limit,
    })

    if (!games || games.length === 0) {
      throw new CustomError('There is no more games available', 400)
    }

    return games
  }
}
