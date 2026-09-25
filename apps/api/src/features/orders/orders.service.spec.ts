import { Test } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
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
  let stripe: {
    createPaymentIntent: jest.Mock
    retrievePaymentIntent: jest.Mock
    updatePaymentIntentMetadata: jest.Mock
  }

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
    stripe = {
      createPaymentIntent: jest.fn(),
      retrievePaymentIntent: jest.fn(),
      updatePaymentIntentMetadata: jest.fn(),
    }

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
      stripe.createPaymentIntent.mockResolvedValue({ id: 'pi_123', client_secret: 'secret_123' })

      const result = await service.createPaymentIntent(user.email, [{ gameId: 1, quantity: 1 }])

      // 59 - 59*0.82 = 10.62 -> 1062 cents
      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(1062, expect.any(Object))
      expect(result).toEqual({ paymentIntentId: 'pi_123', clientSecret: 'secret_123', amount: 1062 })
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

  const digitalItems = JSON.stringify([{ gameId: 1, quantity: 1 }])
  const physicalItems = JSON.stringify([{ gameId: 1, quantity: 1, editionId: 10 }])
  const shippingAddress = {
    shippingName: 'Alex Doe',
    shippingLine1: 'Unter den Linden 1',
    shippingCity: 'Berlin',
    shippingPostalCode: '10115',
    shippingCountry: 'Germany',
  }

  function paymentIntent(overrides: { status?: string; metadata?: Record<string, string> } = {}) {
    return {
      id: 'pi_123',
      status: overrides.status ?? 'succeeded',
      metadata: { userEmail: user.email, items: digitalItems, ...overrides.metadata },
    }
  }

  describe('confirmOrder', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null)
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1, price: 50, discount: 0 }])
      prisma.order.create.mockResolvedValue({ id: 1, items: [] })
    })

    it('rejects a PaymentIntent that has not succeeded', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent({ status: 'requires_payment_method' }))

      await expect(service.confirmOrder(user.email, 'pi_123')).rejects.toThrow('Payment was not completed')
    })

    it('rejects a PaymentIntent that belongs to another user', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(
        paymentIntent({ metadata: { userEmail: 'other@dionis-store.test' } }),
      )

      await expect(service.confirmOrder(user.email, 'pi_123')).rejects.toThrow('Payment not found')
      expect(prisma.order.create).not.toHaveBeenCalled()
    })

    it('creates the order for the user named in the PaymentIntent metadata', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent())

      await service.confirmOrder(user.email, 'pi_123')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: user.email } })
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: user.id, stripePaymentIntentId: 'pi_123' }),
        }),
      )
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

    it('returns the order the webhook committed first when the insert hits the unique index', async () => {
      const webhookOrder = { id: 7, items: [] }
      prisma.order.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(webhookOrder)
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent())
      prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }),
      )

      await expect(service.confirmOrder(user.email, 'pi_123')).resolves.toBe(webhookOrder)
    })

    it('rethrows any other database error', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent())
      prisma.$transaction.mockRejectedValue(new Error('connection lost'))

      await expect(service.confirmOrder(user.email, 'pi_123')).rejects.toThrow('connection lost')
    })
  })

  describe('handlePaymentIntentSucceeded', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null)
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1, price: 50, discount: 0 }])
      prisma.order.create.mockResolvedValue({ id: 1, items: [] })
    })

    it('creates the order from the event payload without calling Stripe again', async () => {
      await service.handlePaymentIntentSucceeded(paymentIntent() as never)

      expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled()
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: user.id, stripePaymentIntentId: 'pi_123' }),
        }),
      )
    })

    it('creates no second order when /confirm already created one', async () => {
      const confirmedOrder = { id: 3, items: [] }
      prisma.order.findUnique.mockResolvedValue(confirmedOrder)

      await expect(service.handlePaymentIntentSucceeded(paymentIntent() as never)).resolves.toBe(confirmedOrder)
      expect(prisma.order.create).not.toHaveBeenCalled()
    })
  })

  describe('an order with a physical edition', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null)
      prisma.game_pc.findMany.mockResolvedValue([])
      prisma.gameEdition.findMany.mockResolvedValue([{ id: 10, price: 69, discount: 0 }])
      prisma.order.create.mockResolvedValue({ id: 1, items: [] })
    })

    it('rejects a physical order with no shipping address on the PaymentIntent', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent({ metadata: { items: physicalItems } }))

      await expect(service.confirmOrder(user.email, 'pi_123')).rejects.toThrow(
        'A shipping address is required for a physical edition',
      )
      expect(prisma.order.create).not.toHaveBeenCalled()
    })

    it('rejects an edition with insufficient stock and creates no order', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(
        paymentIntent({ metadata: { items: physicalItems, ...shippingAddress } }),
      )
      prisma.gameEdition.updateMany.mockResolvedValue({ count: 0 })

      await expect(service.confirmOrder(user.email, 'pi_123')).rejects.toThrow('out of stock')
      expect(prisma.order.create).not.toHaveBeenCalled()
    })

    it('decrements the edition stock atomically and stores the address from the PaymentIntent', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(
        paymentIntent({ metadata: { items: physicalItems, ...shippingAddress, shippingLine2: '' } }),
      )

      await service.confirmOrder(user.email, 'pi_123')

      expect(prisma.gameEdition.updateMany).toHaveBeenCalledWith({
        where: { id: 10, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      })
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...shippingAddress,
            shippingLine2: undefined,
            items: { create: [expect.objectContaining({ editionId: 10, activationCode: null })] },
          }),
        }),
      )
    })
  })

  describe('setShippingAddress', () => {
    it('writes every field as its own metadata key, clearing an omitted line 2', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent({ status: 'requires_payment_method' }))

      await service.setShippingAddress(user.email, 'pi_123', shippingAddress)

      expect(stripe.updatePaymentIntentMetadata).toHaveBeenCalledWith('pi_123', {
        ...shippingAddress,
        shippingLine2: '',
      })
    })

    it('rejects a PaymentIntent that belongs to another user', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(
        paymentIntent({ status: 'requires_payment_method', metadata: { userEmail: 'other@dionis-store.test' } }),
      )

      await expect(service.setShippingAddress(user.email, 'pi_123', shippingAddress)).rejects.toThrow(
        'Payment not found',
      )
      expect(stripe.updatePaymentIntentMetadata).not.toHaveBeenCalled()
    })

    it('rejects a PaymentIntent that is already paid', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent())

      await expect(service.setShippingAddress(user.email, 'pi_123', shippingAddress)).rejects.toThrow(
        'Payment is already completed',
      )
      expect(stripe.updatePaymentIntentMetadata).not.toHaveBeenCalled()
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
