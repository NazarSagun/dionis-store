import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { CreateGameDto } from './dto/create-game.dto'
import { CreateEditionDto, UpdateEditionDto } from './dto/edition.dto'
import { UpdateGameDto } from './dto/update-game.dto'
import { AllowedEdition, AllowedPlatform, AllowedSort } from './dto/games-query.dto'

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
    edition,
    genre,
    minPrice,
    maxPrice,
  }: {
    page: number
    search?: string
    platform?: AllowedPlatform
    sort?: AllowedSort
    edition?: AllowedEdition
    genre?: string
    minPrice?: number
    maxPrice?: number
  }) {
    const limit = 20
    const currentPage = page || 1

    // ponytail: editions have no `kind` column, only a free-text `name`
    // ("Standard Physical Edition", "Collector's Edition"), so standard/
    // collector match on that name. Every game supports a digital purchase
    // with no edition row at all, so `edition=digital` matches everything -
    // upgrade path if that stops being true: an explicit GameEdition.kind
    // enum column plus a migration backfilling it from the existing names.
    const priceMatchIds =
      minPrice !== undefined || maxPrice !== undefined ? await this.findIdsInPriceRange(minPrice, maxPrice) : undefined

    const where: Prisma.Game_pcWhereInput = {
      ...(priceMatchIds && { id: { in: priceMatchIds } }),
      ...(genre && { genre }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(platform && { platform: { contains: platform, mode: 'insensitive' } }),
      ...(edition === 'standard' && { editions: { some: { name: { contains: 'standard', mode: 'insensitive' } } } }),
      ...(edition === 'collector' && {
        editions: { some: { name: { contains: 'collector', mode: 'insensitive' } } },
      }),
    }
    const orderBy = sort ? SORT_TO_ORDER_BY[sort] : { id: 'asc' as const }

    const rows = await this.prisma.game_pc.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * limit,
      take: limit,
      include: { _count: { select: { editions: true } } },
    })
    // The admin games table shows it without a request per row.
    const games = rows.map(({ _count, ...game }) => ({ ...game, editionCount: _count.editions }))

    const totalGames = await this.prisma.game_pc.count({ where })
    const totalPages = Math.ceil(totalGames / limit)

    if (games.length === 0 && totalGames > 0) {
      throw new CustomError('There is no more games available', 400)
    }

    return { totalPages, games }
  }

  async fetchGenres() {
    const genres = await this.prisma.game_pc.groupBy({
      by: ['genre'],
      _count: { _all: true },
      orderBy: { genre: 'asc' },
    })
    return genres.map(({ genre, _count }) => ({ genre, count: _count._all }))
  }

  // ponytail: Prisma cannot filter on a computed value, so this finds the ids
  // whose discounted price is in range with one raw query, and fetchGames
  // narrows its normal query to them. Fine for a catalog of a few hundred
  // games. Upgrade path if it grows: a stored final-price column kept up to
  // date on every price or discount change, with an index.
  // Rounded to cents the same way the cards display it (pricing.ts).
  private async findIdsInPriceRange(minPrice?: number, maxPrice?: number) {
    const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM "Game_pc"
      WHERE ROUND(price * (100 - discount) / 100.0, 2) >= ${minPrice ?? 0}
        AND ROUND(price * (100 - discount) / 100.0, 2) <= ${maxPrice ?? Number.MAX_SAFE_INTEGER}
    `
    return rows.map((row) => row.id)
  }

  async fetchTopDeals() {
    return this.prisma.game_pc.findMany({
      where: { discount: { gt: 0 } },
      orderBy: { discount: 'desc' },
      take: 5,
    })
  }

  async fetchGameById({ gameId }: { gameId: number }) {
    const game = await this.prisma.game_pc.findUnique({
      where: { id: gameId },
      include: { editions: { orderBy: { id: 'asc' } } },
    })
    if (!game) {
      throw new CustomError('There is no such game', 400)
    }

    return game
  }

  // The game with its editions and the store's own review summary. The seed
  // `rating` string stays until the store has enough reviews to replace it.
  async fetchGameDetail({ gameId }: { gameId: number }) {
    const game = await this.fetchGameById({ gameId })
    const { _avg, _count } = await this.prisma.review.aggregate({
      where: { gameId },
      _avg: { rating: true },
      _count: { _all: true },
    })

    return {
      ...game,
      averageRating: _avg.rating === null ? null : Math.round(_avg.rating * 10) / 10,
      reviewCount: _count._all,
    }
  }

  async createGame(data: CreateGameDto) {
    try {
      const game = await this.prisma.game_pc.create({ data })
      // Postgres does not advance a sequence for an explicit id. The seed
      // inserts FreeToGame ids after the migration created the sequence, so
      // without this the next id-less create would collide with game 1.
      if (data.id !== undefined) {
        await this.prisma.$executeRaw`
          SELECT setval('game_pc_id_seq', GREATEST((SELECT MAX(id) FROM "Game_pc"), 1))
        `
      }
      return game
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CustomError('A game with this id or title already exists', 409)
      }
      throw error
    }
  }

  async updateGame(id: number, data: UpdateGameDto) {
    await this.fetchGameById({ gameId: id })
    try {
      return await this.prisma.game_pc.update({ where: { id }, data })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CustomError('A game with this id or title already exists', 409)
      }
      throw error
    }
  }

  // A game someone bought stays: its OrderItem rows point at it. Otherwise
  // its editions and wishlist rows go with it (WishlistItem cascades).
  async deleteGame(id: number) {
    await this.fetchGameById({ gameId: id })
    const orders = await this.prisma.order.count({ where: { items: { some: { gameId: id } } } })
    if (orders > 0) {
      throw new CustomError(`This game is in ${pluralOrders(orders)} and cannot be deleted.`, 409)
    }

    await this.prisma.$transaction([
      this.prisma.gameEdition.deleteMany({ where: { gameId: id } }),
      this.prisma.game_pc.delete({ where: { id } }),
    ])
  }

  async createEdition(gameId: number, data: CreateEditionDto) {
    await this.fetchGameById({ gameId })
    return this.prisma.gameEdition.create({ data: { ...data, gameId } })
  }

  async updateEdition(id: number, data: UpdateEditionDto) {
    await this.getEdition(id)
    return this.prisma.gameEdition.update({ where: { id }, data })
  }

  async deleteEdition(id: number) {
    await this.getEdition(id)
    const orders = await this.prisma.order.count({ where: { items: { some: { editionId: id } } } })
    if (orders > 0) {
      throw new CustomError(`This edition is in ${pluralOrders(orders)} and cannot be deleted.`, 409)
    }
    await this.prisma.gameEdition.delete({ where: { id } })
  }

  private async getEdition(id: number) {
    const edition = await this.prisma.gameEdition.findUnique({ where: { id } })
    if (!edition) {
      throw new CustomError('There is no such edition', 404)
    }
    return edition
  }
}

function pluralOrders(count: number) {
  return count === 1 ? '1 order' : `${count} orders`
}
