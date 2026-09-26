import { randomBytes } from 'crypto'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import Stripe from 'stripe'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { ShippingAddressDto } from './dto/shipping-address.dto'
import { findOwnedItem } from './order-ownership.util'
import { SHIPPING_FEE_CENTS } from './shipping-fee'
import { StripeService } from './stripe.service'

interface OrderItemInput {
  gameId: number
  quantity: number
  editionId?: number | null
}

const ORDER_ITEMS_INCLUDE = { items: { include: { game: true, edition: true }, orderBy: { id: 'asc' as const } } }

function calculateUnitPriceCents(price: number, discount: number): number {
  const discounted = discount > 0 ? price - (price * discount) / 100 : price
  return Math.round(discounted * 100)
}

function generateActivationCode(): string {
  const segment = () => randomBytes(2).toString('hex').toUpperCase()
  return `${segment()}-${segment()}-${segment()}`
}

const SHIPPING_FIELDS = [
  'shippingName',
  'shippingLine1',
  'shippingLine2',
  'shippingCity',
  'shippingPostalCode',
  'shippingCountry',
] as const

// setShippingAddress writes each field as its own metadata key, since one
// Stripe metadata value holds at most 500 characters.
function readShippingAddress(metadata: Stripe.Metadata): ShippingAddressDto | null {
  if (!metadata.shippingName) return null

  return {
    shippingName: metadata.shippingName,
    shippingLine1: metadata.shippingLine1 ?? '',
    shippingLine2: metadata.shippingLine2 || undefined,
    shippingCity: metadata.shippingCity ?? '',
    shippingPostalCode: metadata.shippingPostalCode ?? '',
    shippingCountry: metadata.shippingCountry ?? '',
  }
}

function assertValidItems(items: unknown): asserts items is OrderItemInput[] {
  const isValid =
    Array.isArray(items) &&
    items.length > 0 &&
    items.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        Number.isInteger((item as OrderItemInput).gameId) &&
        Number.isInteger((item as OrderItemInput).quantity) &&
        (item as OrderItemInput).quantity > 0 &&
        ((item as OrderItemInput).editionId == null || Number.isInteger((item as OrderItemInput).editionId)),
    )

  if (!isValid) {
    throw new CustomError('Invalid cart items supplied', 400)
  }
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  async createPaymentIntent(email: string, items: unknown) {
    assertValidItems(items)

    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    await this.assertItemsNotOwned(user.id, items)

    const { totalPrice } = await this.priceOrderItems(items)

    const paymentIntent = await this.stripe.createPaymentIntent(totalPrice, {
      userEmail: email,
      items: JSON.stringify(items),
    })

    return { paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret, amount: totalPrice }
  }

  // The browser calls this right after stripe.confirmPayment succeeds. The
  // webhook (handlePaymentIntentSucceeded) creates the same order when the
  // browser never gets that far. Whichever runs second gets the first's order.
  async confirmOrder(email: string, paymentIntentId: string) {
    const existingOrder = await this.findOrderByPaymentIntent(paymentIntentId)
    if (existingOrder) {
      return existingOrder
    }

    const paymentIntent = await this.stripe.retrievePaymentIntent(paymentIntentId)
    if (paymentIntent.metadata.userEmail !== email) {
      throw new CustomError('Payment not found', 404)
    }
    if (paymentIntent.status !== 'succeeded') {
      throw new CustomError('Payment was not completed', 400)
    }

    return this.createOrderFromPaymentIntent(paymentIntent)
  }

  async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const existingOrder = await this.findOrderByPaymentIntent(paymentIntent.id)
    if (existingOrder) {
      return existingOrder
    }

    return this.createOrderFromPaymentIntent(paymentIntent)
  }

  // Stored on the PaymentIntent, not sent with /confirm, so the webhook can
  // build a physical order even when the browser never calls /confirm. The
  // intent is created before the address form is filled, so this runs at
  // submit time, just before stripe.confirmPayment.
  async setShippingAddress(email: string, paymentIntentId: string, shippingAddress: ShippingAddressDto) {
    const paymentIntent = await this.stripe.retrievePaymentIntent(paymentIntentId)
    if (paymentIntent.metadata.userEmail !== email) {
      throw new CustomError('Payment not found', 404)
    }
    if (paymentIntent.status === 'succeeded') {
      throw new CustomError('Payment is already completed', 409)
    }

    await this.stripe.updatePaymentIntentMetadata(paymentIntentId, {
      ...Object.fromEntries(SHIPPING_FIELDS.map((field) => [field, ''])),
      ...shippingAddress,
    })
  }

  private findOrderByPaymentIntent(paymentIntentId: string) {
    return this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: ORDER_ITEMS_INCLUDE,
    })
  }

  private async createOrderFromPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
    let items: unknown
    try {
      items = JSON.parse(paymentIntent.metadata.items ?? '[]')
    } catch {
      items = null
    }
    assertValidItems(items)

    const user = await this.prisma.user.findUnique({ where: { email: paymentIntent.metadata.userEmail } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    const shippingAddress = readShippingAddress(paymentIntent.metadata)
    const hasPhysicalItem = items.some((item) => item.editionId != null)
    if (hasPhysicalItem && !shippingAddress) {
      throw new CustomError('A shipping address is required for a physical edition', 400)
    }

    // Re-priced only for the per-item prices. The order total is what Stripe
    // actually charged: a discount can change between the Payment step
    // opening (when the amount was fixed) and this call.
    const { pricedItems } = await this.priceOrderItems(items)

    const orderItemsData = pricedItems.map((item) => ({
      gameId: item.gameId,
      editionId: item.editionId ?? null,
      quantity: item.quantity,
      price: item.unitPriceCents,
      // Nothing to redeem on an external platform for a physical purchase.
      activationCode: item.editionId == null ? generateActivationCode() : null,
    }))

    try {
      return await this.prisma.$transaction(async (tx) => {
        for (const item of pricedItems) {
          if (item.editionId == null) continue

          // A single conditional UPDATE, not a read then a write: Postgres
          // locks the row for the statement's own duration, so two concurrent
          // transactions racing for the last unit can't both read "enough
          // stock" before either writes. Exactly one `count` comes back 1.
          const result = await tx.gameEdition.updateMany({
            where: { id: item.editionId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          })
          if (result.count === 0) {
            throw new CustomError(`Edition ${item.editionId} is out of stock`, 409)
          }
        }

        return tx.order.create({
          data: {
            userId: user.id,
            totalPrice: paymentIntent.amount,
            stripePaymentIntentId: paymentIntent.id,
            ...(hasPhysicalItem && shippingAddress ? shippingAddress : {}),
            items: { create: orderItemsData },
          },
          include: ORDER_ITEMS_INCLUDE,
        })
      })
    } catch (error) {
      // /confirm and the webhook raced, and the other one committed first.
      // The unique index on stripePaymentIntentId rejected this insert and
      // rolled back this transaction's stock decrement with it.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existingOrder = await this.findOrderByPaymentIntent(paymentIntent.id)
        if (existingOrder) return existingOrder
      }
      throw error
    }
  }

  // Newest first. Library and Order History both page through this.
  async getOrders(email: string, page: number, pageSize: number) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: user.id },
        include: ORDER_ITEMS_INCLUDE,
        // id breaks ties between orders created in the same millisecond, so
        // no order appears on two pages or on none.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where: { userId: user.id } }),
    ])

    return { items, total, page, pageSize }
  }

  // What a game page needs to show "Already in Library", without loading
  // every order. editionId is null for a digital purchase.
  async getOwnedItems(email: string) {
    return this.prisma.orderItem.findMany({
      where: { order: { user: { email } } },
      select: { gameId: true, editionId: true },
      distinct: ['gameId', 'editionId'],
    })
  }

  async getOrder(email: string, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user: { email } },
      include: ORDER_ITEMS_INCLUDE,
    })

    if (!order) {
      throw new CustomError('Order not found', 404)
    }

    return order
  }

  async activateOrderItem(email: string, orderId: number, itemId: number) {
    const order = await this.getOrder(email, orderId)

    const item = order.items.find((orderItem) => orderItem.id === itemId)
    if (!item) {
      throw new CustomError('Order item not found', 404)
    }

    return this.prisma.orderItem.update({
      where: { id: itemId },
      data: { activated: true, activatedAt: new Date() },
      include: { game: true },
    })
  }

  // Charging via Stripe happens right after this call, so the check runs
  // before a payment intent is even created - rejecting later, at confirm
  // time, would mean the user already paid for a game they can't be sold.
  private async assertItemsNotOwned(userId: number, items: OrderItemInput[]) {
    const owned = await findOwnedItem(this.prisma, userId, items)

    if (owned) {
      throw new CustomError('You already own one or more of these items', 409)
    }
  }

  private async priceOrderItems(items: OrderItemInput[]) {
    const editionIds = items.filter((item) => item.editionId != null).map((item) => item.editionId as number)

    // `in: []` is a valid Prisma query that simply returns no rows, so this
    // always runs rather than branching on editionIds.length - a ternary
    // whose other branch was a bare `[]` made this pair's type ambiguous
    // enough to confuse ts-jest's checker (not plain tsc) into losing
    // `editions`'s element type entirely.
    const [games, editions] = await Promise.all([
      this.prisma.game_pc.findMany({ where: { id: { in: items.map((item) => item.gameId) } } }),
      this.prisma.gameEdition.findMany({ where: { id: { in: editionIds } } }),
    ])

    const pricedItems = items.map((item) => {
      if (item.editionId != null) {
        const edition = editions.find((candidate) => candidate.id === item.editionId)
        if (!edition) {
          throw new CustomError(`Edition ${item.editionId} does not exist`, 400)
        }
        return { ...item, unitPriceCents: calculateUnitPriceCents(edition.price, edition.discount) }
      }

      const game = games.find((candidate) => candidate.id === item.gameId)
      if (!game) {
        throw new CustomError(`Game ${item.gameId} does not exist`, 400)
      }
      return { ...item, unitPriceCents: calculateUnitPriceCents(game.price, game.discount) }
    })

    const hasPhysicalItem = items.some((item) => item.editionId != null)
    const shippingFee = hasPhysicalItem ? SHIPPING_FEE_CENTS : 0
    const itemsTotal = pricedItems.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0)

    return { pricedItems, hasPhysicalItem, shippingFee, totalPrice: itemsTotal + shippingFee }
  }
}
