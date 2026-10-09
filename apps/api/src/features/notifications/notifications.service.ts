import { Injectable } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { PrismaService } from '../../common/prisma/prisma.service'

export const NOTIFICATIONS_LIST_SIZE = 20

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // The unread rows, newest first. The count covers all of them, also those
  // beyond the list size. It returns the actor's name and never an email.
  async list(email: string) {
    const userId = await this.getUserId(email)
    const where = { userId, readAt: null }

    const [unreadCount, rows] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { id: 'desc' },
        take: NOTIFICATIONS_LIST_SIZE,
        select: {
          id: true,
          createdAt: true,
          reply: {
            select: {
              user: { select: { name: true } },
              review: { select: { id: true, gameId: true, game: { select: { title: true } } } },
            },
          },
        },
      }),
    ])

    return {
      unreadCount,
      notifications: rows.map(({ id, createdAt, reply }) => ({
        id,
        type: 'review_reply' as const,
        gameId: reply.review.gameId,
        gameTitle: reply.review.game.title,
        reviewId: reply.review.id,
        actorName: reply.user.name?.trim() || 'Anonymous',
        createdAt,
      })),
    }
  }

  // A notification of another user looks like a missing one. Reading one that
  // is already read is not an error.
  async markRead(email: string, id: number) {
    const userId = await this.getUserId(email)
    const notification = await this.prisma.notification.findFirst({ where: { id, userId }, select: { id: true } })
    if (!notification) {
      throw new CustomError('There is no such notification', 404)
    }
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } })
  }

  async markAllRead(email: string) {
    const userId = await this.getUserId(email)
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })
  }

  private async getUserId(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }
    return user.id
  }
}
