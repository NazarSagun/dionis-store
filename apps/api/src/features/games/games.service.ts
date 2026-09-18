import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { CreateGameDto } from './dto/create-game.dto'

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchGames({ page }: { page: number }) {
    const limit = 20
    const currentPage = page || 1

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
    const game = await this.prisma.game_pc.findUnique({ where: { id: gameId } })
    if (!game) {
      throw new CustomError('There is no such game', 400)
    }

    return game
  }

  async createGame(data: CreateGameDto) {
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
