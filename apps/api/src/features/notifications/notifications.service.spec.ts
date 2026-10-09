import { Test } from '@nestjs/testing'
import { PrismaService } from '../../common/prisma/prisma.service'
import { NotificationsService } from './notifications.service'

describe('NotificationsService', () => {
  let service: NotificationsService
  let prisma: {
    user: { findUnique: jest.Mock }
    notification: { count: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock; updateMany: jest.Mock }
  }

  const email = 'player@dionis-store.test'

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 7 }) },
      notification: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ id: 3 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    }

    const module = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get(NotificationsService)
  })

  describe('list', () => {
    it('returns the unread rows, newest first, with the actor name and no email or user id', async () => {
      prisma.notification.count.mockResolvedValue(25)
      prisma.notification.findMany.mockResolvedValue([
        {
          id: 9,
          createdAt: new Date('2026-10-09'),
          reply: { user: { name: ' Vadym ' }, review: { id: 4, gameId: 3, game: { title: 'Ironclad Siege' } } },
        },
        {
          id: 8,
          createdAt: new Date('2026-10-08'),
          reply: { user: { name: null }, review: { id: 5, gameId: 6, game: { title: 'Neon Drift' } } },
        },
      ])

      const result = await service.list(email)

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 7, readAt: null }, orderBy: { id: 'desc' }, take: 20 }),
      )
      expect(prisma.notification.count).toHaveBeenCalledWith({ where: { userId: 7, readAt: null } })
      expect(result).toEqual({
        unreadCount: 25,
        notifications: [
          {
            id: 9,
            type: 'review_reply',
            gameId: 3,
            gameTitle: 'Ironclad Siege',
            reviewId: 4,
            actorName: 'Vadym',
            createdAt: new Date('2026-10-09'),
          },
          {
            id: 8,
            type: 'review_reply',
            gameId: 6,
            gameTitle: 'Neon Drift',
            reviewId: 5,
            actorName: 'Anonymous',
            createdAt: new Date('2026-10-08'),
          },
        ],
      })
    })

    it('returns an empty list and a zero count when nothing is unread', async () => {
      await expect(service.list(email)).resolves.toEqual({ unreadCount: 0, notifications: [] })
    })

    it('rejects a user that does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.list(email)).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('markRead', () => {
    it('sets the read date on an unread notification of the user', async () => {
      await service.markRead(email, 3)

      expect(prisma.notification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 3, userId: 7 } }),
      )
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 3, userId: 7, readAt: null },
        data: { readAt: expect.any(Date) },
      })
    })

    it('answers 404 for a notification of another user and changes nothing', async () => {
      prisma.notification.findFirst.mockResolvedValue(null)

      await expect(service.markRead(email, 3)).rejects.toMatchObject({ statusCode: 404 })
      expect(prisma.notification.updateMany).not.toHaveBeenCalled()
    })
  })

  describe('markAllRead', () => {
    it('sets the read date on every unread notification of the user only', async () => {
      await service.markAllRead(email)

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 7, readAt: null },
        data: { readAt: expect.any(Date) },
      })
    })
  })
})
