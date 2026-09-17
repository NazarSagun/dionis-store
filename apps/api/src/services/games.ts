import { Prisma, PrismaClient } from '@prisma/client'
import { CustomError } from '../middleware'
import dotenv from 'dotenv'

dotenv.config()

export interface CreateGameInput {
  id: number
  title: string
  thumbnail: string
  short_description: string
  game_url: string
  genre: string
  platform: string
  publisher: string
  developer: string
  release_date: string
  freetogame_profile_url: string
  price: number
  rating: string
  discount: number
}

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

  async createGame(data: CreateGameInput) {
    try {
      return await this.prisma.game_pc.create({ data })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CustomError('A game with this id or title already exists', 409)
      }
      throw error
    }
  }
}
