import { Injectable } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { PrismaService } from '../../common/prisma/prisma.service'
import { findOwnedGame } from '../orders/order-ownership.util'
import { UpsertReviewDto } from './dto/upsert-review.dto'

export const REVIEWS_PAGE_SIZE = 10

const OWN_REVIEW_SELECT = { id: true, rating: true, body: true, createdAt: true, updatedAt: true } as const

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // The public list. It returns the author's name and never the email or the
  // user id.
  async list(gameId: number, page: number) {
    await this.assertGameExists(gameId)

    const [total, rows] = await Promise.all([
      this.prisma.review.count({ where: { gameId } }),
      this.prisma.review.findMany({
        where: { gameId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * REVIEWS_PAGE_SIZE,
        take: REVIEWS_PAGE_SIZE,
        select: { id: true, rating: true, body: true, createdAt: true, user: { select: { name: true } } },
      }),
    ])

    return {
      totalPages: Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE)),
      reviews: rows.map(({ user, ...review }) => ({ ...review, authorName: user.name?.trim() || 'Anonymous' })),
    }
  }

  async getOwn(email: string, gameId: number) {
    const userId = await this.getUserId(email)
    const review = await this.prisma.review.findUnique({
      where: { userId_gameId: { userId, gameId } },
      select: OWN_REVIEW_SELECT,
    })
    if (!review) {
      throw new CustomError('You have not reviewed this game', 404)
    }
    return review
  }

  // Creates the review, or replaces the rating and text of the existing one.
  async upsert(email: string, gameId: number, dto: UpsertReviewDto) {
    const userId = await this.getUserId(email)
    await this.assertGameExists(gameId)

    if (!(await findOwnedGame(this.prisma, userId, gameId))) {
      throw new CustomError('You can only review games you own.', 403)
    }

    const data = { rating: dto.rating, body: dto.body ?? '' }
    return this.prisma.review.upsert({
      where: { userId_gameId: { userId, gameId } },
      create: { userId, gameId, ...data },
      update: data,
      select: OWN_REVIEW_SELECT,
    })
  }

  private async getUserId(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }
    return user.id
  }

  private async assertGameExists(gameId: number) {
    const game = await this.prisma.game_pc.findUnique({ where: { id: gameId }, select: { id: true } })
    if (!game) {
      throw new CustomError('There is no such game', 400)
    }
  }
}
