import { Injectable } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { PrismaService } from '../../common/prisma/prisma.service'
import { findOwnedGame } from '../orders/order-ownership.util'
import { CreateReplyDto } from './dto/create-reply.dto'
import { UpsertReviewDto } from './dto/upsert-review.dto'

export const REVIEWS_PAGE_SIZE = 10
export const REPLIES_PAGE_SIZE = 10

const OWN_REVIEW_SELECT = { id: true, rating: true, body: true, createdAt: true, updatedAt: true } as const

// The public shapes. They carry the author's name and never the email or the
// user id.
const PUBLIC_REVIEW_SELECT = {
  id: true,
  rating: true,
  body: true,
  createdAt: true,
  user: { select: { name: true } },
  _count: { select: { replies: true } },
} as const

const PUBLIC_REPLY_SELECT = { id: true, body: true, createdAt: true, user: { select: { name: true } } } as const

const authorName = (user: { name: string | null }) => user.name?.trim() || 'Anonymous'

function toPublicReview<T extends { user: { name: string | null }; _count: { replies: number } }>({
  user,
  _count,
  ...review
}: T) {
  return { ...review, authorName: authorName(user), replyCount: _count.replies }
}

function toPublicReply<T extends { user: { name: string | null } }>({ user, ...reply }: T) {
  return { ...reply, authorName: authorName(user) }
}

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
        select: PUBLIC_REVIEW_SELECT,
      }),
    ])

    return {
      totalPages: Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE)),
      reviews: rows.map(toPublicReview),
    }
  }

  // One review, for the link in a notification. It adds the game id, so the
  // page can tell a review of another game.
  async getById(reviewId: number) {
    const row = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { ...PUBLIC_REVIEW_SELECT, gameId: true },
    })
    if (!row) {
      throw new CustomError('There is no such review', 404)
    }
    return { ...toPublicReview(row), gameId: row.gameId }
  }

  async listReplies(reviewId: number, page: number) {
    await this.assertReviewExists(reviewId)

    const [total, rows] = await Promise.all([
      this.prisma.reviewReply.count({ where: { reviewId } }),
      this.prisma.reviewReply.findMany({
        where: { reviewId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * REPLIES_PAGE_SIZE,
        take: REPLIES_PAGE_SIZE,
        select: PUBLIC_REPLY_SELECT,
      }),
    ])

    return {
      totalPages: Math.max(1, Math.ceil(total / REPLIES_PAGE_SIZE)),
      replies: rows.map(toPublicReply),
    }
  }

  // Saves the reply and one notification for the review author and for every
  // other user who already replied. The writer never gets one. All of it runs
  // in one transaction, so a reply never exists without its notifications.
  async createReply(email: string, reviewId: number, dto: CreateReplyDto) {
    const userId = await this.getUserId(email)
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { gameId: true, userId: true },
    })
    if (!review) {
      throw new CustomError('There is no such review', 404)
    }
    if (!(await findOwnedGame(this.prisma, userId, review.gameId))) {
      throw new CustomError('You can only reply to games you own.', 403)
    }

    return this.prisma.$transaction(async (tx) => {
      const earlier = await tx.reviewReply.findMany({
        where: { reviewId },
        select: { userId: true },
        distinct: ['userId'],
      })
      const reply = await tx.reviewReply.create({
        data: { reviewId, userId, body: dto.body },
        select: PUBLIC_REPLY_SELECT,
      })
      const recipients = new Set([review.userId, ...earlier.map((row) => row.userId)])
      recipients.delete(userId)
      await tx.notification.createMany({
        data: [...recipients].map((recipientId) => ({ userId: recipientId, replyId: reply.id })),
      })
      return toPublicReply(reply)
    })
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

  private async assertReviewExists(reviewId: number) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId }, select: { id: true } })
    if (!review) {
      throw new CustomError('There is no such review', 404)
    }
  }

  private async assertGameExists(gameId: number) {
    const game = await this.prisma.game_pc.findUnique({ where: { id: gameId }, select: { id: true } })
    if (!game) {
      throw new CustomError('There is no such game', 400)
    }
  }
}
