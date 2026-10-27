import { Injectable, Logger } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { MailService } from '../../common/mail/mail.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { findOwnedItem } from '../orders/order-ownership.util'

@Injectable()
export class StockAlertsService {
  private readonly logger = new Logger(StockAlertsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // Safe to run twice: the unique (user, edition) pair makes the second run a no-op.
  async subscribe(email: string, editionId: number) {
    const userId = await this.getUserId(email)
    const edition = await this.prisma.gameEdition.findUnique({ where: { id: editionId } })
    if (!edition) {
      throw new CustomError('There is no such edition', 404)
    }
    if (edition.stock > 0) {
      throw new CustomError('This edition is in stock', 409)
    }
    if (await findOwnedItem(this.prisma, userId, [{ gameId: edition.gameId, editionId }])) {
      throw new CustomError('You already own this edition', 409)
    }

    // An alert that already fired is opened again, so the next raise notifies the user again.
    await this.prisma.stockAlert.upsert({
      where: { userId_editionId: { userId, editionId } },
      create: { userId, editionId },
      update: { notifiedAt: null },
    })
  }

  async unsubscribe(email: string, editionId: number) {
    const userId = await this.getUserId(email)
    await this.prisma.stockAlert.deleteMany({ where: { userId, editionId } })
  }

  // The editions of one game with an open alert of this user.
  async listForGame(email: string, gameId: number) {
    const userId = await this.getUserId(email)
    const alerts = await this.prisma.stockAlert.findMany({
      where: { userId, notifiedAt: null, edition: { gameId } },
      select: { editionId: true },
      orderBy: { editionId: 'asc' },
    })
    return { editionIds: alerts.map((alert) => alert.editionId) }
  }

  // Called when an edition goes from 0 to above 0. A conditional update claims
  // each alert, so two raises at the same moment never notify a user twice.
  async fire(editionId: number) {
    const edition = await this.prisma.gameEdition.findUnique({
      where: { id: editionId },
      select: { name: true, gameId: true, game: { select: { title: true } } },
    })
    if (!edition) return

    const claimed = await this.prisma.$transaction(async (tx) => {
      const alerts = await tx.stockAlert.findMany({
        where: { editionId, notifiedAt: null },
        select: { id: true, userId: true, user: { select: { email: true } } },
      })
      const won: typeof alerts = []
      for (const alert of alerts) {
        const { count } = await tx.stockAlert.updateMany({
          where: { id: alert.id, notifiedAt: null },
          data: { notifiedAt: new Date() },
        })
        if (count === 1) won.push(alert)
      }
      await tx.notification.createMany({ data: won.map(({ userId }) => ({ userId, editionId })) })
      return won
    })

    // The bell item stays when a send fails, because the user still needs to know.
    for (const { user } of claimed) {
      try {
        await this.mail.sendRestockAlert(user.email, {
          gameId: edition.gameId,
          gameTitle: edition.game.title,
          editionName: edition.name,
        })
      } catch (error) {
        this.logger.error(`Restock alert for edition ${editionId} was not sent to ${user.email}`, error)
      }
    }
  }

  private async getUserId(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }
    return user.id
  }
}
