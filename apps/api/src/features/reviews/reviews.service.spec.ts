import { Test } from '@nestjs/testing'
import { CustomError } from '../../common/errors/custom-error'
import { PrismaService } from '../../common/prisma/prisma.service'
import { ReviewsService } from './reviews.service'

describe('ReviewsService', () => {
  let service: ReviewsService
  let prisma: {
    user: { findUnique: jest.Mock }
    game_pc: { findUnique: jest.Mock }
    orderItem: { findFirst: jest.Mock }
    review: { count: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; upsert: jest.Mock }
  }

  const email = 'player@dionis-store.test'

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 7 }) },
      game_pc: { findUnique: jest.fn().mockResolvedValue({ id: 3 }) },
      orderItem: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
      review: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ id: 9, rating: 4 }),
      },
    }

    const module = await Test.createTestingModule({
      providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get(ReviewsService)
  })

  describe('list', () => {
    it('returns one page, newest first, with the author name and no email or user id', async () => {
      prisma.review.count.mockResolvedValue(11)
      prisma.review.findMany.mockResolvedValue([
        { id: 2, rating: 5, body: 'Great', createdAt: new Date('2026-10-08'), user: { name: ' Mara ' } },
        { id: 1, rating: 3, body: '', createdAt: new Date('2026-10-07'), user: { name: null } },
      ])

      const result = await service.list(3, 2)

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gameId: 3 },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: 10,
          take: 10,
        }),
      )
      expect(result.totalPages).toBe(2)
      expect(result.reviews).toEqual([
        { id: 2, rating: 5, body: 'Great', createdAt: new Date('2026-10-08'), authorName: 'Mara' },
        { id: 1, rating: 3, body: '', createdAt: new Date('2026-10-07'), authorName: 'Anonymous' },
      ])
    })

    it('reports one page when there is no review', async () => {
      await expect(service.list(3, 1)).resolves.toEqual({ totalPages: 1, reviews: [] })
    })

    it('rejects a game that does not exist', async () => {
      prisma.game_pc.findUnique.mockResolvedValue(null)

      await expect(service.list(99, 1)).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('upsert', () => {
    it('saves the review of an owner, keyed by user and game', async () => {
      await service.upsert(email, 3, { rating: 4, body: 'Good' })

      expect(prisma.orderItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { gameId: 3, order: { userId: 7 } } }),
      )
      expect(prisma.review.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_gameId: { userId: 7, gameId: 3 } },
          create: { userId: 7, gameId: 3, rating: 4, body: 'Good' },
          update: { rating: 4, body: 'Good' },
        }),
      )
    })

    it('stores an empty text when none is sent', async () => {
      await service.upsert(email, 3, { rating: 5 })

      expect(prisma.review.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { rating: 5, body: '' } }))
    })

    it('answers 403 and stores nothing when the user did not buy the game', async () => {
      prisma.orderItem.findFirst.mockResolvedValue(null)

      await expect(service.upsert(email, 3, { rating: 4 })).rejects.toMatchObject({ statusCode: 403 })
      expect(prisma.review.upsert).not.toHaveBeenCalled()
    })

    it('rejects a game that does not exist before the ownership check', async () => {
      prisma.game_pc.findUnique.mockResolvedValue(null)

      await expect(service.upsert(email, 99, { rating: 4 })).rejects.toBeInstanceOf(CustomError)
      expect(prisma.orderItem.findFirst).not.toHaveBeenCalled()
    })

    it('rejects a user that does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.upsert(email, 3, { rating: 4 })).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('getOwn', () => {
    it('returns the review of the user', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 9, rating: 4, body: 'Good' })

      await expect(service.getOwn(email, 3)).resolves.toEqual({ id: 9, rating: 4, body: 'Good' })
      expect(prisma.review.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId_gameId: { userId: 7, gameId: 3 } } }),
      )
    })

    it('answers 404 when the user has not reviewed the game', async () => {
      prisma.review.findUnique.mockResolvedValue(null)

      await expect(service.getOwn(email, 3)).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
