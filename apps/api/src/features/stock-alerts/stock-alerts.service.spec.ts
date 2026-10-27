import { Test } from '@nestjs/testing'
import { MailService } from '../../common/mail/mail.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { StockAlertsService } from './stock-alerts.service'

describe('StockAlertsService', () => {
  let service: StockAlertsService
  let prisma: {
    user: { findUnique: jest.Mock }
    gameEdition: { findUnique: jest.Mock }
    orderItem: { findFirst: jest.Mock }
    stockAlert: { upsert: jest.Mock; deleteMany: jest.Mock; findMany: jest.Mock; updateMany: jest.Mock }
    notification: { createMany: jest.Mock }
    $transaction: jest.Mock
  }
  let mail: { sendRestockAlert: jest.Mock }

  const email = 'player@dionis-store.test'
  const edition = { id: 10, gameId: 1, name: "Collector's Edition", stock: 0, game: { title: 'Ironclad Siege' } }

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 7 }) },
      gameEdition: { findUnique: jest.fn().mockResolvedValue(edition) },
      orderItem: { findFirst: jest.fn().mockResolvedValue(null) },
      stockAlert: {
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((run: (tx: typeof prisma) => unknown) => run(prisma))
    mail = { sendRestockAlert: jest.fn().mockResolvedValue(true) }

    const module = await Test.createTestingModule({
      providers: [
        StockAlertsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
      ],
    }).compile()

    service = module.get(StockAlertsService)
  })

  describe('subscribe', () => {
    it('opens an alert for an out-of-stock edition, and opens a fired one again', async () => {
      await service.subscribe(email, 10)

      expect(prisma.stockAlert.upsert).toHaveBeenCalledWith({
        where: { userId_editionId: { userId: 7, editionId: 10 } },
        create: { userId: 7, editionId: 10 },
        update: { notifiedAt: null },
      })
    })

    it('returns 404 for an unknown edition', async () => {
      prisma.gameEdition.findUnique.mockResolvedValue(null)

      await expect(service.subscribe(email, 99)).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 409 for an edition in stock', async () => {
      prisma.gameEdition.findUnique.mockResolvedValue({ ...edition, stock: 3 })

      await expect(service.subscribe(email, 10)).rejects.toMatchObject({ statusCode: 409 })
      expect(prisma.stockAlert.upsert).not.toHaveBeenCalled()
    })

    it('returns 409 for an edition the user owns', async () => {
      prisma.orderItem.findFirst.mockResolvedValue({ id: 1 })

      await expect(service.subscribe(email, 10)).rejects.toMatchObject({ statusCode: 409 })
      expect(prisma.stockAlert.upsert).not.toHaveBeenCalled()
    })
  })

  describe('unsubscribe', () => {
    it('deletes the alert of this user only', async () => {
      await service.unsubscribe(email, 10)

      expect(prisma.stockAlert.deleteMany).toHaveBeenCalledWith({ where: { userId: 7, editionId: 10 } })
    })
  })

  describe('listForGame', () => {
    it('lists the edition ids with an open alert of this user', async () => {
      prisma.stockAlert.findMany.mockResolvedValue([{ editionId: 10 }, { editionId: 12 }])

      await expect(service.listForGame(email, 1)).resolves.toEqual({ editionIds: [10, 12] })
      expect(prisma.stockAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 7, notifiedAt: null, edition: { gameId: 1 } } }),
      )
    })
  })

  describe('fire', () => {
    const alerts = [
      { id: 1, userId: 7, user: { email } },
      { id: 2, userId: 8, user: { email: 'other@dionis-store.test' } },
    ]

    it('claims each open alert, makes one notification per claimed alert, and sends one email each', async () => {
      prisma.stockAlert.findMany.mockResolvedValue(alerts)

      await service.fire(10)

      expect(prisma.stockAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { editionId: 10, notifiedAt: null } }),
      )
      expect(prisma.stockAlert.updateMany).toHaveBeenCalledWith({
        where: { id: 1, notifiedAt: null },
        data: { notifiedAt: expect.any(Date) },
      })
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 7, editionId: 10 },
          { userId: 8, editionId: 10 },
        ],
      })
      expect(mail.sendRestockAlert).toHaveBeenCalledTimes(2)
      expect(mail.sendRestockAlert).toHaveBeenCalledWith(email, {
        gameId: 1,
        gameTitle: 'Ironclad Siege',
        editionName: "Collector's Edition",
      })
    })

    it('skips an alert that another raise already claimed, so nobody is notified twice', async () => {
      prisma.stockAlert.findMany.mockResolvedValue(alerts)
      prisma.stockAlert.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 })

      await service.fire(10)

      expect(prisma.notification.createMany).toHaveBeenCalledWith({ data: [{ userId: 8, editionId: 10 }] })
      expect(mail.sendRestockAlert).toHaveBeenCalledTimes(1)
    })

    it('sends nothing when no alert is open', async () => {
      await service.fire(10)

      expect(prisma.notification.createMany).toHaveBeenCalledWith({ data: [] })
      expect(mail.sendRestockAlert).not.toHaveBeenCalled()
    })

    it('keeps the notification and does not throw when the email fails', async () => {
      prisma.stockAlert.findMany.mockResolvedValue(alerts)
      mail.sendRestockAlert.mockRejectedValue(new Error('SMTP down'))

      await expect(service.fire(10)).resolves.toBeUndefined()

      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1)
      expect(mail.sendRestockAlert).toHaveBeenCalledTimes(2)
    })
  })
})
