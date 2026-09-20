import { randomBytes } from 'crypto'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'
import { StripeService } from './stripe.service'

interface OrderItemInput {
  gameId: number
  quantity: number
}

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
        (item as OrderItemInput).quantity > 0,
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

    const amountCents = await this.calculateAmountCents(items)

    const paymentIntent = await this.stripe.createPaymentIntent(amountCents, {
      userEmail: email,
      items: JSON.stringify(items),
    })

    return { clientSecret: paymentIntent.client_secret, amount: amountCents }
  }

  async confirmOrder(email: string, paymentIntentId: string) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { items: { include: { game: true }, orderBy: { id: 'asc' } } },
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

    const games = await this.prisma.game_pc.findMany({
      where: { id: { in: items.map((item) => item.gameId) } },
    })

    const orderItemsData = items.map((item) => {
      const game = games.find((g) => g.id === item.gameId)
      if (!game) {
        throw new CustomError(`Game ${item.gameId} does not exist`, 400)
      }
      return {
        gameId: item.gameId,
        quantity: item.quantity,
        price: calculateUnitPriceCents(game.price, game.discount),
        activationCode: generateActivationCode(),
      }
    })

    const totalPrice = orderItemsData.reduce((total, item) => total + item.price * item.quantity, 0)

    return this.prisma.order.create({
      data: {
        userId: user.id,
        totalPrice,
        stripePaymentIntentId: paymentIntentId,
        items: { create: orderItemsData },
      },
      include: { items: { include: { game: true }, orderBy: { id: 'asc' } } },
    })
  }

  async getOrders(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    return this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { game: true }, orderBy: { id: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getOrder(email: string, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user: { email } },
      include: { items: { include: { game: true }, orderBy: { id: 'asc' } } },
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

  private async calculateAmountCents(items: OrderItemInput[]) {
    const games = await this.prisma.game_pc.findMany({
      where: { id: { in: items.map((item) => item.gameId) } },
    })

    return items.reduce((total, item) => {
      const game = games.find((g) => g.id === item.gameId)
      if (!game) {
        throw new CustomError(`Game ${item.gameId} does not exist`, 400)
      }
      return total + calculateUnitPriceCents(game.price, game.discount) * item.quantity
    }, 0)
  }
}
