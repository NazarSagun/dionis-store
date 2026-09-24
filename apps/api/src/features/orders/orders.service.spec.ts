import { Test } from '@nestjs/testing'
import { PrismaService } from '../../common/prisma/prisma.service'
import { OrdersService } from './orders.service'
import { StripeService } from './stripe.service'

describe('OrdersService', () => {
  let service: OrdersService
  let prisma: {
    user: { findUnique: jest.Mock }
    game_pc: { findMany: jest.Mock }
    gameEdition: { findMany: jest.Mock; updateMany: jest.Mock }
    order: { findUnique: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock }
    orderItem: { update: jest.Mock; findFirst: jest.Mock }
    $transaction: jest.Mock
  }
  let stripe: { createPaymentIntent: jest.Mock; retrievePaymentIntent: jest.Mock }

  const user = { id: 1, email: 'player@dionis-store.test' }

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      game_pc: { findMany: jest.fn() },
      gameEdition: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      order: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
      orderItem: { update: jest.fn(), findFirst: jest.fn().mockResolvedValue(null) },
      // A transparent pass-through: the callback runs against the same mock
      // `prisma`, so every other test can keep asserting on
      // `prisma.order.create` etc. without knowing a transaction wraps it.
      $transaction: jest.fn((callback) => callback(prisma)),
    }
    stripe = { createPaymentIntent: jest.fn(), retrievePaymentIntent: jest.fn() }

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: StripeService, useValue: stripe },
      ],
    }).compile()

    service = module.get(OrdersService)
  })

  describe('createPaymentIntent', () => {
    it('applies the discount when computing the Stripe amount, in cents', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1, price: 59, discount: 82 }])
      stripe.createPaymentIntent.mockResolvedValue({ client_secret: 'secret_123' })

      const result = await service.createPaymentIntent(user.email, [{ gameId: 1, quantity: 1 }])

      // 59 - 59*0.82 = 10.62 -> 1062 cents
      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(1062, expect.any(Object))
      expect(result).toEqual({ clientSecret: 'secret_123', amount: 1062 })
    })

    it('charges the full price when there is no discount', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 2, price: 30, discount: 0 }])
      stripe.createPaymentIntent.mockResolvedValue({ client_secret: 'secret_456' })

      await service.createPaymentIntent(user.email, [{ gameId: 2, quantity: 2 }])

      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(6000, expect.any(Object))
    })

    it('rejects an empty items array', async () => {
      await expect(service.createPaymentIntent(user.email, [])).rejects.toThrow('Invalid cart items supplied')
    })

    it('adds the flat shipping fee once when the cart holds a physical edition', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1, price: 50, discount: 0 }])
      prisma.gameEdition.findMany.mockResolvedValue([{ id: 10, price: 69, discount: 0 }])
      stripe.createPaymentIntent.mockResolvedValue({ client_secret: 'secret_789' })

      await service.createPaymentIntent(user.email, [
        { gameId: 1, quantity: 1 },
        { gameId: 1, quantity: 1, editionId: 10 },
      ])

      // 50*100 digital + 69*100 physical + the 500-cent flat fee = 12400
      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(12400, expect.any(Object))
    })

    it('charges no shipping fee for a digital-only cart', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1, price: 50, discount: 0 }])
      stripe.createPaymentIntent.mockResolvedValue({ client_secret: 'secret_000' })

      await service.createPaymentIntent(user.email, [{ gameId: 1, quantity: 1 }])

      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(5000, expect.any(Object))
    })

    it('rejects a game already owned as a digital purchase, before Stripe is ever called', async () => {
      prisma.orderItem.findFirst.mockResolvedValue({ id: 1 })

      await expect(service.createPaymentIntent(user.email, [{ gameId: 1, quantity: 1 }])).rejects.toThrow(
        'You already own',
      )
      expect(stripe.createPaymentIntent).not.toHaveBeenCalled()
    })

    it('rejects a specific edition already owned, even when the digital copy is not', async () => {
      prisma.orderItem.findFirst.mockResolvedValue({ id: 1 })

      await expect(
        service.createPaymentIntent(user.email, [{ gameId: 1, quantity: 1, editionId: 10 }]),
      ).rejects.toThrow('You already own')
    })

    it('looks up ownership by the exact (gameId, editionId) pair for every cart line', async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1, price: 50, discount: 0 }])
      prisma.gameEdition.findMany.mockResolvedValue([{ id: 10, price: 69, discount: 0 }])
      stripe.createPaymentIntent.mockResolvedValue({ client_secret: 'secret_ok' })

      await service.createPaymentIntent(user.email, [
        { gameId: 1, quantity: 1 },
        { gameId: 1, quantity: 1, editionId: 10 },
      ])

      expect(prisma.orderItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            order: { userId: user.id },
            OR: [
              { gameId: 1, editionId: null },
              { gameId: 1, editionId: 10 },
            ],
          },
        }),
      )
    })
  })

  describe('confirmOrder', () => {
    it('rejects a PaymentIntent that has not succeeded', async () => {
      prisma.order.findUnique.mockResolvedValue(null)
      stripe.retrievePaymentIntent.mockResolvedValue({ status: 'requires_payment_method' })

      await expect(service.confirmOrder(user.email, 'pi_123')).rejects.toThrow('Payment was not completed')
    })

    it('returns the existing order instead of creating a duplicate for the same PaymentIntent', async () => {
      const existingOrder = { id: 1, items: [] }
      prisma.order.findUnique.mockResolvedValue(existingOrder)

      const result = await service.confirmOrder(user.email, 'pi_123')

      expect(result).toBe(existingOrder)
      expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled()
      expect(prisma.order.create).not.toHaveBeenCalled()
    })

    it('orders the items by id when reading back an already-confirmed order', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 1, items: [] })

      await service.confirmOrder(user.email, 'pi_123')

      const [args] = prisma.order.findUnique.mock.calls[0]
      expect(args.include.items.orderBy).toEqual({ id: 'asc' })
    })
  })

  describe('confirmOrder with a physical edition', () => {
    const shippingAddress = {
      shippingName: 'Alex Doe',
      shippingLine1: 'Unter den Linden 1',
      shippingCity: 'Berlin',
      shippingPostalCode: '10115',
      shippingCountry: 'Germany',
    }

    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null)
      prisma.game_pc.findMany.mockResolvedValue([])
      stripe.retrievePaymentIntent.mockResolvedValue({
        status: 'succeeded',
        metadata: { items: JSON.stringify([{ gameId: 1, quantity: 1, editionId: 10 }]) },
      })
      prisma.gameEdition.findMany.mockResolvedValue([{ id: 10, price: 69, discount: 0 }])
      prisma.order.create.mockResolvedValue({ id: 1, items: [] })
    })

    it('rejects a physical order with no shipping address', async () => {
      await expect(service.confirmOrder(user.email, 'pi_123')).rejects.toThrow(
        'A shipping address is required for a physical edition',
      )
      expect(prisma.order.create).not.toHaveBeenCalled()
    })

    it('rejects an edition with insufficient stock and creates no order', async () => {
      prisma.gameEdition.updateMany.mockResolvedValue({ count: 0 })

      await expect(service.confirmOrder(user.email, 'pi_123', shippingAddress)).rejects.toThrow('out of stock')
      expect(prisma.order.create).not.toHaveBeenCalled()
    })

    it('decrements the edition stock atomically and stores the shipping address', async () => {
      await service.confirmOrder(user.email, 'pi_123', shippingAddress)

      expect(prisma.gameEdition.updateMany).toHaveBeenCalledWith({
        where: { id: 10, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      })
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...shippingAddress,
            items: { create: [expect.objectContaining({ editionId: 10, activationCode: null })] },
          }),
        }),
      )
    })
  })

  describe('getOrders', () => {
    it('lists every order for the user, newest first', async () => {
      const orders = [{ id: 2 }, { id: 1 }]
      prisma.order.findMany.mockResolvedValue(orders)

      const result = await service.getOrders(user.email)

      expect(result).toBe(orders)
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      )
    })

    it('orders each order’s items by id, since Postgres gives no default row order for a to-many include', async () => {
      prisma.order.findMany.mockResolvedValue([])

      await service.getOrders(user.email)

      const [args] = prisma.order.findMany.mock.calls[0]
      expect(args.include.items.orderBy).toEqual({ id: 'asc' })
    })

    it('rejects a user that does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.getOrders(user.email)).rejects.toThrow('User does not exist')
      expect(prisma.order.findMany).not.toHaveBeenCalled()
    })
  })

  describe('getOrder', () => {
    it('rejects a request for an order that does not belong to this user', async () => {
      prisma.order.findFirst.mockResolvedValue(null)

      await expect(service.getOrder(user.email, 1)).rejects.toThrow('Order not found')
      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1, user: { email: user.email } } }),
      )
    })

    it('orders the items by id, so a client rendering by row index sees a stable order', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 1, items: [] })

      await service.getOrder(user.email, 1)

      const [args] = prisma.order.findFirst.mock.calls[0]
      expect(args.include.items.orderBy).toEqual({ id: 'asc' })
    })
  })

  describe('activateOrderItem', () => {
    it('rejects an item id that is not part of the order', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 1, items: [{ id: 99 }] })

      await expect(service.activateOrderItem(user.email, 1, 1)).rejects.toThrow('Order item not found')
      expect(prisma.orderItem.update).not.toHaveBeenCalled()
    })
  })
})
