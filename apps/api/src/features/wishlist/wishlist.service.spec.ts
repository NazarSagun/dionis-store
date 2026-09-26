import { Test } from '@nestjs/testing'
import { PrismaService } from '../../common/prisma/prisma.service'
import { WishlistService } from './wishlist.service'

describe('WishlistService', () => {
  let service: WishlistService
  let prisma: {
    user: { findUnique: jest.Mock }
    game_pc: { findUnique: jest.Mock; findMany: jest.Mock }
    wishlistItem: {
      findMany: jest.Mock
      upsert: jest.Mock
      deleteMany: jest.Mock
      updateMany: jest.Mock
      createMany: jest.Mock
    }
  }

  const email = 'player@dionis-store.test'
  const list = [{ gameId: 1, discountSnapshot: 10 }]

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 7 }) },
      game_pc: { findUnique: jest.fn().mockResolvedValue({ discount: 30 }), findMany: jest.fn() },
      wishlistItem: {
        findMany: jest.fn().mockResolvedValue(list),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn(),
      },
    }

    const module = await Test.createTestingModule({
      providers: [WishlistService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get(WishlistService)
  })

  it('lists only this user’s items, newest first', async () => {
    await expect(service.list(email)).resolves.toBe(list)

    expect(prisma.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 }, orderBy: { createdAt: 'desc' } }),
    )
  })

  it('rejects a user that does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(service.list(email)).rejects.toThrow('User does not exist')
  })

  describe('add', () => {
    it('takes the snapshot from the game’s current discount and returns the list', async () => {
      await expect(service.add(email, 1)).resolves.toBe(list)

      expect(prisma.wishlistItem.upsert).toHaveBeenCalledWith({
        where: { userId_gameId: { userId: 7, gameId: 1 } },
        create: { userId: 7, gameId: 1, discountSnapshot: 30 },
        update: {},
      })
    })

    it('rejects a game that does not exist', async () => {
      prisma.game_pc.findUnique.mockResolvedValue(null)

      await expect(service.add(email, 999)).rejects.toThrow('Game 999 does not exist')
      expect(prisma.wishlistItem.upsert).not.toHaveBeenCalled()
    })
  })

  it('removes only this user’s row for the game', async () => {
    await service.remove(email, 1)

    expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({ where: { userId: 7, gameId: 1 } })
  })

  describe('acknowledgeDiscount', () => {
    it('moves the snapshot to the current discount', async () => {
      await service.acknowledgeDiscount(email, 1)

      expect(prisma.wishlistItem.updateMany).toHaveBeenCalledWith({
        where: { userId: 7, gameId: 1 },
        data: { discountSnapshot: 30 },
      })
    })

    it('rejects a game that is not on the wishlist', async () => {
      prisma.wishlistItem.updateMany.mockResolvedValue({ count: 0 })

      await expect(service.acknowledgeDiscount(email, 1)).rejects.toThrow('Game is not on the wishlist')
    })
  })

  describe('merge', () => {
    it('adds the guest items, keeps their snapshots, and skips games already on the account', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
      const addedAt = Date.now() - 60_000

      await service.merge(email, [
        { gameId: 1, discount: 10, addedAt },
        { gameId: 2, discount: 0 },
      ])

      const [args] = prisma.wishlistItem.createMany.mock.calls[0]
      expect(args.skipDuplicates).toBe(true)
      expect(args.data).toEqual([
        { userId: 7, gameId: 1, discountSnapshot: 10, createdAt: new Date(addedAt) },
        { userId: 7, gameId: 2, discountSnapshot: 0, createdAt: expect.any(Date) },
      ])
    })

    it('drops games that no longer exist instead of failing', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1 }])

      await service.merge(email, [
        { gameId: 1, discount: 0 },
        { gameId: 404, discount: 0 },
      ])

      const [args] = prisma.wishlistItem.createMany.mock.calls[0]
      expect(args.data.map((row: { gameId: number }) => row.gameId)).toEqual([1])
    })

    it('never back-dates an item into the future', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1 }])
      const future = Date.now() + 86_400_000

      await service.merge(email, [{ gameId: 1, discount: 0, addedAt: future }])

      const [args] = prisma.wishlistItem.createMany.mock.calls[0]
      expect(args.data[0].createdAt.getTime()).toBeLessThan(future)
    })
  })
})
