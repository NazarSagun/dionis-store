import { Test } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { MailService } from '../../common/mail/mail.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { OrdersService } from './orders.service'
import { StripeService } from './stripe.service'

describe('OrdersService', () => {
  let service: OrdersService
  let prisma: {
    user: { findUnique: jest.Mock }
    game_pc: { findMany: jest.Mock }
    gameEdition: { findMany: jest.Mock; updateMany: jest.Mock }
    order: {
      findUnique: jest.Mock
      findFirst: jest.Mock
      findMany: jest.Mock
      create: jest.Mock
      count: jest.Mock
      updateMany: jest.Mock
      update: jest.Mock
    }
    orderItem: { update: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock }
    $transaction: jest.Mock
  }
  let mail: { sendOrderReceipt: jest.Mock }
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
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
      orderItem: { update: jest.fn(), findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn() },
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

    mail = { sendOrderReceipt: jest.fn().mockResolvedValue(true) }

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: StripeService, useValue: stripe },
        { provide: MailService, useValue: mail },
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
      prisma.gameEdition.findMany.mockResolvedValue([{ id: 10, gameId: 1, price: 69, discount: 0 }])
      stripe.createPaymentIntent.mockResolvedValue({ client_secret: 'secret_789' })

      await service.createPaymentIntent(user.email, [
        { gameId: 1, quantity: 1 },
        { gameId: 1, quantity: 1, editionId: 10 },
      ])

      // 50*100 digital + 69*100 physical + the 500-cent flat fee = 12400
      expect(stripe.createPaymentIntent).toHaveBeenCalledWith(12400, expect.any(Object))
    })

    it("rejects an edition bought under another game's id", async () => {
      prisma.game_pc.findMany.mockResolvedValue([{ id: 2, price: 200, discount: 0 }])
      prisma.gameEdition.findMany.mockResolvedValue([{ id: 10, gameId: 1, price: 5, discount: 0 }])

      await expect(
        service.createPaymentIntent(user.email, [{ gameId: 2, quantity: 1, editionId: 10 }]),
      ).rejects.toThrow('Edition 10 does not exist for game 2')
      expect(stripe.createPaymentIntent).not.toHaveBeenCalled()
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
      prisma.gameEdition.findMany.mockResolvedValue([{ id: 10, gameId: 1, price: 69, discount: 0 }])
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

  function paymentIntent(overrides: { status?: string; amount?: number; metadata?: Record<string, string> } = {}) {
    return {
      id: 'pi_123',
      status: overrides.status ?? 'succeeded',
      amount: overrides.amount ?? 5000,
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

    it('stores the amount Stripe charged as the total, even when the price changed since', async () => {
      // Charged at 50€; the game went on sale to 40€ before the order was created.
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent({ amount: 5000 }))
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1, price: 50, discount: 20 }])

      await service.confirmOrder(user.email, 'pi_123')

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ totalPrice: 5000 }) }),
      )
    })

    it('returns the existing order instead of creating a duplicate for the same PaymentIntent', async () => {
      const existingOrder = { id: 1, userId: user.id, items: [] }
      prisma.order.findUnique.mockResolvedValue(existingOrder)

      const result = await service.confirmOrder(user.email, 'pi_123')

      expect(result).toBe(existingOrder)
      expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled()
      expect(prisma.order.create).not.toHaveBeenCalled()
    })

    it("does not return another user's existing order", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 1, userId: 2, items: [] })

      await expect(service.confirmOrder(user.email, 'pi_123')).rejects.toThrow('Payment not found')
    })

    it('orders the items by id when reading back an already-confirmed order', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 1, userId: user.id, items: [] })

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

  describe('receipt email', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null)
      prisma.game_pc.findMany.mockResolvedValue([{ id: 1, price: 50, discount: 0 }])
      prisma.order.create.mockResolvedValue({ id: 7, items: [] })
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent())
    })

    it('sends the receipt to the customer after the order is created', async () => {
      await service.confirmOrder(user.email, 'pi_123')

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 7, receiptSentAt: null },
        data: { receiptSentAt: expect.any(Date) },
      })
      expect(mail.sendOrderReceipt).toHaveBeenCalledWith(user.email, expect.objectContaining({ id: 7 }))
      expect(prisma.order.update).not.toHaveBeenCalled()
    })

    it('does not send when another call already claimed the receipt', async () => {
      prisma.order.updateMany.mockResolvedValue({ count: 0 })

      await service.confirmOrder(user.email, 'pi_123')

      expect(mail.sendOrderReceipt).not.toHaveBeenCalled()
    })

    it('sends nothing for an order that already existed', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 7, userId: user.id, items: [] })

      await service.confirmOrder(user.email, 'pi_123')

      expect(mail.sendOrderReceipt).not.toHaveBeenCalled()
      expect(prisma.order.updateMany).not.toHaveBeenCalled()
    })

    it('sends nothing for the order that the other racing call committed', async () => {
      prisma.order.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }),
      )
      prisma.order.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 7, items: [] })

      await service.confirmOrder(user.email, 'pi_123')

      expect(mail.sendOrderReceipt).not.toHaveBeenCalled()
    })

    it('releases the claim and still returns the order when the send fails', async () => {
      mail.sendOrderReceipt.mockRejectedValue(new Error('SMTP down'))

      await expect(service.confirmOrder(user.email, 'pi_123')).resolves.toEqual(expect.objectContaining({ id: 7 }))

      expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { receiptSentAt: null } })
    })

    it('releases the claim when mail is turned off', async () => {
      mail.sendOrderReceipt.mockResolvedValue(false)

      await service.confirmOrder(user.email, 'pi_123')

      expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { receiptSentAt: null } })
    })

    it('returns the order even when releasing the claim fails too', async () => {
      mail.sendOrderReceipt.mockRejectedValue(new Error('SMTP down'))
      prisma.order.update.mockRejectedValue(new Error('db down'))

      await expect(service.confirmOrder(user.email, 'pi_123')).resolves.toEqual(expect.objectContaining({ id: 7 }))
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
      const confirmedOrder = { id: 3, userId: user.id, items: [] }
      prisma.order.findUnique.mockResolvedValue(confirmedOrder)

      await expect(service.handlePaymentIntentSucceeded(paymentIntent() as never)).resolves.toBe(confirmedOrder)
      expect(prisma.order.create).not.toHaveBeenCalled()
    })
  })

  describe('an order with a physical edition', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null)
      prisma.game_pc.findMany.mockResolvedValue([])
      prisma.gameEdition.findMany.mockResolvedValue([{ id: 10, gameId: 1, price: 69, discount: 0 }])
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

    it('never writes a key outside the six shipping fields, such as items', async () => {
      stripe.retrievePaymentIntent.mockResolvedValue(paymentIntent({ status: 'requires_payment_method' }))
      const tampered = { ...shippingAddress, items: JSON.stringify([{ gameId: 99, quantity: 50 }]) }

      await service.setShippingAddress(user.email, 'pi_123', tampered)

      const [, metadata] = stripe.updatePaymentIntentMetadata.mock.calls[0]
      expect(Object.keys(metadata).sort()).toEqual([
        'shippingCity',
        'shippingCountry',
        'shippingLine1',
        'shippingLine2',
        'shippingName',
        'shippingPostalCode',
      ])
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
    it('returns one page of the user’s orders, newest first, with the total', async () => {
      const orders = [{ id: 7 }, { id: 6 }]
      prisma.order.findMany.mockResolvedValue(orders)
      prisma.order.count.mockResolvedValue(12)

      const result = await service.getOrders(user.email, 2, 5)

      expect(result).toEqual({ items: orders, total: 12, page: 2, pageSize: 5 })
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: user.id },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: 5,
          take: 5,
        }),
      )
      expect(prisma.order.count).toHaveBeenCalledWith({ where: { userId: user.id } })
    })

    it('orders each order’s items by id, since Postgres gives no default row order for a to-many include', async () => {
      prisma.order.findMany.mockResolvedValue([])

      await service.getOrders(user.email, 1, 5)

      const [args] = prisma.order.findMany.mock.calls[0]
      expect(args.include.items.orderBy).toEqual({ id: 'asc' })
    })

    it('rejects a user that does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.getOrders(user.email, 1, 5)).rejects.toThrow('User does not exist')
      expect(prisma.order.findMany).not.toHaveBeenCalled()
    })
  })

  describe('listAllOrders', () => {
    it('pages through every customer\u2019s orders, newest first, with each email', async () => {
      prisma.order.findMany.mockResolvedValue([{ id: 9 }])
      prisma.order.count.mockResolvedValue(41)

      await expect(service.listAllOrders(3, 20)).resolves.toEqual({
        items: [{ id: 9 }],
        total: 41,
        page: 3,
        pageSize: 20,
      })
      const [args] = prisma.order.findMany.mock.calls[0]
      expect(args).toMatchObject({ where: {}, skip: 40, take: 20, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
      expect(args.include.user).toEqual({ select: { email: true } })
    })

    it('filters by a case-insensitive fragment of the customer email', async () => {
      prisma.order.findMany.mockResolvedValue([])
      prisma.order.count.mockResolvedValue(0)

      await service.listAllOrders(1, 20, 'ALEX@')

      const where = { user: { email: { contains: 'ALEX@', mode: 'insensitive' } } }
      expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }))
      expect(prisma.order.count).toHaveBeenCalledWith({ where })
    })
  })

  describe('getOwnedItems', () => {
    it('returns each distinct game and edition the user bought, across every order', async () => {
      const owned = [
        { gameId: 1, editionId: null },
        { gameId: 1, editionId: 10 },
      ]
      prisma.orderItem.findMany.mockResolvedValue(owned)

      await expect(service.getOwnedItems(user.email)).resolves.toBe(owned)
      expect(prisma.orderItem.findMany).toHaveBeenCalledWith({
        where: { order: { user: { email: user.email } } },
        select: { gameId: true, editionId: true },
        distinct: ['gameId', 'editionId'],
      })
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
