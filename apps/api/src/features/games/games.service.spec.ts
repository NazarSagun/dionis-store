import { Test } from '@nestjs/testing'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { GamesService } from './games.service'

describe('GamesService', () => {
  let service: GamesService
  let prisma: { game_pc: { findMany: jest.Mock; count: jest.Mock; groupBy: jest.Mock }; $queryRaw: jest.Mock }

  beforeEach(async () => {
    prisma = {
      game_pc: {
        findMany: jest.fn().mockResolvedValue([{ id: 1, title: 'Some Game' }]),
        count: jest.fn().mockResolvedValue(1),
        groupBy: jest.fn(),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 4 }, { id: 9 }]),
    }

    const module = await Test.createTestingModule({
      providers: [GamesService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get(GamesService)
  })

  describe('query building (correctness)', () => {
    it('adds a case-insensitive title filter when search is given', async () => {
      await service.fetchGames({ page: 1, search: 'zelda' })

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: { contains: 'zelda', mode: 'insensitive' },
          }),
        }),
      )
    })

    it('adds no title filter when search is absent', async () => {
      await service.fetchGames({ page: 1 })

      const call = prisma.game_pc.findMany.mock.calls[0][0]
      expect(call.where?.title).toBeUndefined()
    })

    it('adds a platform contains filter when platform is given', async () => {
      await service.fetchGames({ page: 1, platform: 'PS5' })

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            platform: { contains: 'PS5', mode: 'insensitive' },
          }),
        }),
      )
    })

    it('adds no editions filter when edition is digital', async () => {
      await service.fetchGames({ page: 1, edition: 'digital' })

      const call = prisma.game_pc.findMany.mock.calls[0][0]
      expect(call.where?.editions).toBeUndefined()
    })

    it.each([
      ['standard', 'standard'],
      ['collector', 'collector'],
    ] as const)('adds an editions.some.name contains filter when edition is %s', async (edition, expectedName) => {
      await service.fetchGames({ page: 1, edition })

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            editions: { some: { name: { contains: expectedName, mode: 'insensitive' } } },
          }),
        }),
      )
    })

    it.each([
      ['price_asc', { price: 'asc' }],
      ['price_desc', { price: 'desc' }],
      ['rating_desc', { rating: 'desc' }],
    ] as const)('maps sort=%s to the matching orderBy', async (sort, expected) => {
      await service.fetchGames({ page: 1, sort })

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: expected }))
    })

    it('defaults to ordering by id when no sort is given', async () => {
      await service.fetchGames({ page: 1 })

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { id: 'asc' } }))
    })

    it('returns an empty result instead of throwing when the filter matches nothing', async () => {
      prisma.game_pc.findMany.mockResolvedValue([])
      prisma.game_pc.count.mockResolvedValue(0)

      const result = await service.fetchGames({ page: 1, search: 'no-such-game' })

      expect(result).toEqual({ totalPages: 0, games: [] })
    })

    it('still throws when the requested page is past the end of a non-empty result set', async () => {
      prisma.game_pc.findMany.mockResolvedValue([])
      prisma.game_pc.count.mockResolvedValue(40)

      await expect(service.fetchGames({ page: 5 })).rejects.toThrow(CustomError)
    })
  })

  describe('genre and price filters', () => {
    it('matches the genre exactly', async () => {
      await service.fetchGames({ page: 1, genre: 'Shooter' })

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ genre: 'Shooter' }) }),
      )
    })

    it('narrows the query to the ids whose discounted price is in range', async () => {
      await service.fetchGames({ page: 1, minPrice: 15, maxPrice: 30 })

      const [sql, ...values] = prisma.$queryRaw.mock.calls[0]
      expect(sql.join('?')).toContain('ROUND(price * (100 - discount) / 100.0, 2)')
      expect(values).toEqual([15, 30])
      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: { in: [4, 9] } }) }),
      )
    })

    it('leaves the missing end of a price range open', async () => {
      await service.fetchGames({ page: 1, maxPrice: 20 })

      const [, min, max] = prisma.$queryRaw.mock.calls[0]
      expect([min, max]).toEqual([0, 20])
    })

    it('runs no price query when no price is given', async () => {
      await service.fetchGames({ page: 1, genre: 'Shooter' })

      expect(prisma.$queryRaw).not.toHaveBeenCalled()
      const [args] = prisma.game_pc.findMany.mock.calls[0]
      expect(args.where.id).toBeUndefined()
    })

    it('lists the genres with their game counts, alphabetically', async () => {
      prisma.game_pc.groupBy.mockResolvedValue([
        { genre: 'MOBA', _count: { _all: 18 } },
        { genre: 'Shooter', _count: { _all: 94 } },
      ])

      await expect(service.fetchGenres()).resolves.toEqual([
        { genre: 'MOBA', count: 18 },
        { genre: 'Shooter', count: 94 },
      ])
      expect(prisma.game_pc.groupBy).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { genre: 'asc' } }))
    })
  })

  describe('input handling (security)', () => {
    it('treats a SQL-injection-shaped search string as an inert literal, not a 500', async () => {
      prisma.game_pc.findMany.mockResolvedValue([])
      prisma.game_pc.count.mockResolvedValue(0)

      const payload = "' OR '1'='1' --"
      const result = await service.fetchGames({ page: 1, search: payload })

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ title: { contains: payload, mode: 'insensitive' } }),
        }),
      )
      expect(result).toEqual({ totalPages: 0, games: [] })
    })

    it('never widens the query when search contains SQL wildcard characters', async () => {
      await service.fetchGames({ page: 1, search: '%_%' })

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ title: { contains: '%_%', mode: 'insensitive' } }),
        }),
      )
    })
  })

  describe('fetchTopDeals', () => {
    it('only fetches games with a positive discount, ordered highest first, capped at 5', async () => {
      await service.fetchTopDeals()

      expect(prisma.game_pc.findMany).toHaveBeenCalledWith({
        where: { discount: { gt: 0 } },
        orderBy: { discount: 'desc' },
        take: 5,
      })
    })

    it('returns an empty array instead of throwing when no game has a discount', async () => {
      prisma.game_pc.findMany.mockResolvedValue([])

      const result = await service.fetchTopDeals()

      expect(result).toEqual([])
    })
  })
})
