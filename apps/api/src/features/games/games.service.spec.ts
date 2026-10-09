import { Test } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { GamesService } from './games.service'

describe('GamesService', () => {
  let service: GamesService
  let prisma: {
    game_pc: {
      findMany: jest.Mock
      count: jest.Mock
      groupBy: jest.Mock
      findUnique: jest.Mock
      create: jest.Mock
      update: jest.Mock
      delete: jest.Mock
    }
    gameEdition: {
      findUnique: jest.Mock
      create: jest.Mock
      update: jest.Mock
      delete: jest.Mock
      deleteMany: jest.Mock
    }
    order: { count: jest.Mock }
    review: { aggregate: jest.Mock; groupBy: jest.Mock }
    $queryRaw: jest.Mock
    $executeRaw: jest.Mock
    $transaction: jest.Mock
  }

  beforeEach(async () => {
    prisma = {
      game_pc: {
        findMany: jest.fn().mockResolvedValue([{ id: 1, title: 'Some Game', _count: { editions: 2 } }]),
        count: jest.fn().mockResolvedValue(1),
        groupBy: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: 1, editions: [] }),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn().mockReturnValue('delete-game'),
      },
      gameEdition: {
        findUnique: jest.fn().mockResolvedValue({ id: 10, gameId: 1 }),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockReturnValue('delete-editions'),
      },
      order: { count: jest.fn().mockResolvedValue(0) },
      review: {
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { _all: 0 } }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
      $executeRaw: jest.fn(),
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

  describe('admin catalog changes', () => {
    it('adds each game\u2019s edition count to the list', async () => {
      const { games } = await service.fetchGames({ page: 1 })

      expect(games).toEqual([{ id: 1, title: 'Some Game', editionCount: 2 }])
    })

    it('maps a duplicate title on update to a 409', async () => {
      prisma.game_pc.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }),
      )

      await expect(service.updateGame(1, { title: 'Taken' })).rejects.toMatchObject({ statusCode: 409 })
    })

    it('moves the id sequence past an explicit id, so the next id-less game does not collide', async () => {
      prisma.game_pc.create.mockResolvedValue({ id: 900005 })

      await service.createGame({ id: 900005 } as never)
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1)
      expect(prisma.$executeRaw.mock.calls[0][0].join('')).toContain("setval('game_pc_id_seq'")

      await service.createGame({ title: 'No id' } as never)
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1)
    })

    it('refuses to delete a game that is in an order, naming the count', async () => {
      prisma.order.count.mockResolvedValue(1)

      await expect(service.deleteGame(1)).rejects.toThrow('This game is in 1 order and cannot be deleted.')
      prisma.order.count.mockResolvedValue(3)
      await expect(service.deleteGame(1)).rejects.toThrow('This game is in 3 orders and cannot be deleted.')
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('deletes an unbought game together with its editions, in one transaction', async () => {
      await service.deleteGame(1)

      expect(prisma.order.count).toHaveBeenCalledWith({ where: { items: { some: { gameId: 1 } } } })
      expect(prisma.gameEdition.deleteMany).toHaveBeenCalledWith({ where: { gameId: 1 } })
      expect(prisma.$transaction).toHaveBeenCalledWith(['delete-editions', 'delete-game'])
    })

    it('creates an edition on an existing game only', async () => {
      prisma.game_pc.findUnique.mockResolvedValue(null)

      await expect(
        service.createEdition(999, { name: 'Deluxe', price: 45, discount: 0, stock: 3, description: 'Box' }),
      ).rejects.toThrow('There is no such game')
      expect(prisma.gameEdition.create).not.toHaveBeenCalled()
    })

    it('refuses to delete an edition that is in an order', async () => {
      prisma.order.count.mockResolvedValue(2)

      await expect(service.deleteEdition(10)).rejects.toThrow('This edition is in 2 orders and cannot be deleted.')
      expect(prisma.order.count).toHaveBeenCalledWith({ where: { items: { some: { editionId: 10 } } } })
      expect(prisma.gameEdition.delete).not.toHaveBeenCalled()
    })

    it('returns 404 for an unknown edition', async () => {
      prisma.gameEdition.findUnique.mockResolvedValue(null)

      await expect(service.updateEdition(404, { stock: 1 })).rejects.toMatchObject({ statusCode: 404 })
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

    it('adds the average rating and the review count of each deal', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 4 }, { id: 9 }])
      prisma.review.groupBy.mockResolvedValue([{ gameId: 9, _avg: { rating: 4.25 }, _count: { _all: 8 } }])

      const result = await service.fetchTopDeals()

      expect(prisma.review.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { gameId: { in: [4, 9] } } }))
      expect(result).toEqual([
        { id: 4, averageRating: null, reviewCount: 0 },
        { id: 9, averageRating: 4.3, reviewCount: 8 },
      ])
    })

    it('skips the review query when there is no deal', async () => {
      prisma.game_pc.findMany.mockResolvedValue([])

      await service.fetchTopDeals()

      expect(prisma.review.groupBy).not.toHaveBeenCalled()
    })
  })

  describe('fetchGameDetail', () => {
    it('adds the average rating rounded to one decimal and the review count', async () => {
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.3333 }, _count: { _all: 3 } })

      const game = await service.fetchGameDetail({ gameId: 1 })

      expect(prisma.review.aggregate).toHaveBeenCalledWith(expect.objectContaining({ where: { gameId: 1 } }))
      expect(game).toMatchObject({ id: 1, averageRating: 4.3, reviewCount: 3 })
    })

    it('returns a null average and a zero count for a game without reviews', async () => {
      const game = await service.fetchGameDetail({ gameId: 1 })

      expect(game).toMatchObject({ averageRating: null, reviewCount: 0 })
    })

    it('rejects a game that does not exist without counting reviews', async () => {
      prisma.game_pc.findUnique.mockResolvedValue(null)

      await expect(service.fetchGameDetail({ gameId: 99 })).rejects.toBeInstanceOf(CustomError)
      expect(prisma.review.aggregate).not.toHaveBeenCalled()
    })
  })
})
