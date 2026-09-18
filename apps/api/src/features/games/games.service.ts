import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { CreateGameDto } from './dto/create-game.dto'
import { AllowedPlatform, AllowedSort } from './dto/games-query.dto'

const SORT_TO_ORDER_BY: Record<AllowedSort, Prisma.Game_pcOrderByWithRelationInput> = {
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  // ponytail: rating is stored as a string ("4.42"), so this sorts lexicographically.
  // That matches numeric order only while every rating has one digit before the
  // decimal point, which is true for the whole dataset today. Upgrade path if that
  // ever changes: a parameterized `ORDER BY CAST(rating AS DECIMAL)` raw query, or
  // move `rating` to a Decimal/Float column.
  rating_desc: { rating: 'desc' },
}

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchGames({
    page,
    search,
    platform,
    sort,
  }: {
    page: number
    search?: string
    platform?: AllowedPlatform
    sort?: AllowedSort
  }) {
    const limit = 20
    const currentPage = page || 1

    const where: Prisma.Game_pcWhereInput = {
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(platform && { platform: { contains: platform, mode: 'insensitive' } }),
    }
    const orderBy = sort ? SORT_TO_ORDER_BY[sort] : { id: 'asc' as const }

    const games = await this.prisma.game_pc.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * limit,
      take: limit,
    })

    const totalGames = await this.prisma.game_pc.count({ where })
    const totalPages = Math.ceil(totalGames / limit)

    if (games.length === 0 && totalGames > 0) {
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
