import { PrismaClient } from '@prisma/client'
import { CustomError } from '../middleware'
import dotenv from 'dotenv'

dotenv.config()

export class GamesService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async fetchGames({ page }: { page: number }) {
    const limit = 20
    const currentPage: number = page || 1

    const games = await this.prisma.game_pc.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
    })

    const totalGames = await this.prisma.game_pc.count()
    const totalPages = Math.ceil(totalGames / limit)

    if (!games || games.length === 0) {
      throw new CustomError('There is no more games available', 400)
    }

    return { totalPages, games }
  }

  async fetchGameById({ gameId }: { gameId: number }) {
    const game = await this.prisma.game_pc.findUnique({
      where: {
        id: gameId,
      },
    })

    if (!game) {
      throw new CustomError('There is no such game', 400)
    }

    return game
  }
}
