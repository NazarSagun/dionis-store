import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { GuestWishlistItemDto } from './dto/merge-wishlist.dto'

const WISHLIST_SELECT = {
  gameId: true,
  discountSnapshot: true,
  createdAt: true,
  game: {
    select: { id: true, title: true, thumbnail: true, price: true, platform: true, rating: true, discount: true },
  },
} as const

// Every write returns the whole list, so the web store can replace its copy
// with the server's instead of patching it.
@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(email: string) {
    const userId = await this.getUserId(email)
    return this.listForUser(userId)
  }

  async add(email: string, gameId: number) {
    const userId = await this.getUserId(email)
    const game = await this.getGame(gameId)

    // The snapshot comes from the database, not the client. Adding a game
    // that is already on the list keeps its original snapshot.
    await this.prisma.wishlistItem.upsert({
      where: { userId_gameId: { userId, gameId } },
      create: { userId, gameId, discountSnapshot: game.discount },
      update: {},
    })

    return this.listForUser(userId)
  }

  async remove(email: string, gameId: number) {
    const userId = await this.getUserId(email)
    await this.prisma.wishlistItem.deleteMany({ where: { userId, gameId } })
    return this.listForUser(userId)
  }

  // Called once the "Price dropped" badge has shown, so the same drop does
  // not show it again (account-area-spec.md Feature 8).
  async acknowledgeDiscount(email: string, gameId: number) {
    const userId = await this.getUserId(email)
    const game = await this.getGame(gameId)

    const { count } = await this.prisma.wishlistItem.updateMany({
      where: { userId, gameId },
      data: { discountSnapshot: game.discount },
    })
    if (count === 0) {
      throw new CustomError('Game is not on the wishlist', 404)
    }

    return this.listForUser(userId)
  }

  async merge(email: string, items: GuestWishlistItemDto[]) {
    const userId = await this.getUserId(email)

    // A guest list can hold a game that no longer exists. Drop those instead
    // of failing the whole merge on a foreign key error.
    const existingGames = await this.prisma.game_pc.findMany({
      where: { id: { in: items.map((item) => item.gameId) } },
      select: { id: true },
    })
    const existingIds = new Set(existingGames.map((game) => game.id))
    const now = Date.now()

    await this.prisma.wishlistItem.createMany({
      data: items
        .filter((item) => existingIds.has(item.gameId))
        .map((item) => ({
          userId,
          gameId: item.gameId,
          discountSnapshot: item.discount,
          createdAt: new Date(item.addedAt !== undefined && item.addedAt <= now ? item.addedAt : now),
        })),
      // A game already on the account keeps the account's snapshot.
      skipDuplicates: true,
    })

    return this.listForUser(userId)
  }

  private listForUser(userId: number) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      select: WISHLIST_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  }

  private async getUserId(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }
    return user.id
  }

  private async getGame(gameId: number) {
    const game = await this.prisma.game_pc.findUnique({ where: { id: gameId }, select: { discount: true } })
    if (!game) {
      throw new CustomError(`Game ${gameId} does not exist`, 404)
    }
    return game
  }
}
