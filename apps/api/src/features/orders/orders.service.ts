import { randomBytes } from 'crypto'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { ShippingAddressDto } from './dto/shipping-address.dto'
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

    const { totalPrice } = await this.priceOrderItems(items)

    const paymentIntent = await this.stripe.createPaymentIntent(totalPrice, {
      userEmail: email,
      items: JSON.stringify(items),
    })

    return { clientSecret: paymentIntent.client_secret, amount: totalPrice }
  }

  async confirmOrder(email: string, paymentIntentId: string, shippingAddress?: ShippingAddressDto) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: ORDER_ITEMS_INCLUDE,
    })
    if (existingOrder) {
      return existingOrder
    }

    const paymentIntent = await this.stripe.retrievePaymentIntent(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      throw new CustomError('Payment was not completed', 400)
    }

    let items: unknown
    try {
      items = JSON.parse(paymentIntent.metadata.items ?? '[]')
    } catch {
      items = null
    }
    assertValidItems(items)

    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    const hasPhysicalItem = items.some((item) => item.editionId != null)
    if (hasPhysicalItem && !shippingAddress) {
      throw new CustomError('A shipping address is required for a physical edition', 400)
    }

    const { pricedItems, totalPrice } = await this.priceOrderItems(items)

    const orderItemsData = pricedItems.map((item) => ({
      gameId: item.gameId,
      editionId: item.editionId ?? null,
      quantity: item.quantity,
      price: item.unitPriceCents,
      // Nothing to redeem on an external platform for a physical purchase.
      activationCode: item.editionId == null ? generateActivationCode() : null,
    }))

    return this.prisma.$transaction(async (tx) => {
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
          totalPrice,
          stripePaymentIntentId: paymentIntentId,
          ...(hasPhysicalItem && shippingAddress ? shippingAddress : {}),
          items: { create: orderItemsData },
        },
        include: ORDER_ITEMS_INCLUDE,
      })
    })
  }

  async getOrders(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    return this.prisma.order.findMany({
      where: { userId: user.id },
      include: ORDER_ITEMS_INCLUDE,
      orderBy: { createdAt: 'desc' },
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

  private async priceOrderItems(items: OrderItemInput[]) {
    const editionIds = items.filter((item) => item.editionId != null).map((item) => item.editionId as number)

    const [games, editions] = await Promise.all([
      this.prisma.game_pc.findMany({ where: { id: { in: items.map((item) => item.gameId) } } }),
      editionIds.length > 0 ? this.prisma.gameEdition.findMany({ where: { id: { in: editionIds } } }) : [],
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
