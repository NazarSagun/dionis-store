import { Test } from '@nestjs/testing'
import { PrismaService } from '../../common/prisma/prisma.service'
import { OrdersService } from './orders.service'
import { StripeService } from './stripe.service'

describe('OrdersService', () => {
  let service: OrdersService
  let prisma: {
    user: { findUnique: jest.Mock }
    game_pc: { findMany: jest.Mock }
    order: { findUnique: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock }
    orderItem: { update: jest.Mock }
  }
  let stripe: { createPaymentIntent: jest.Mock; retrievePaymentIntent: jest.Mock }

  const user = { id: 1, email: 'player@dionis-store.test' }

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      game_pc: { findMany: jest.fn() },
      order: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
      orderItem: { update: jest.fn() },
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
