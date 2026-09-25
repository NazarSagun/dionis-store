import { HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import Stripe from 'stripe'
import { CustomError } from '../../common/errors/custom-error'
import { OrdersService } from './orders.service'
import { StripeService } from './stripe.service'
import { StripeWebhookController } from './stripe-webhook.controller'

const WEBHOOK_SECRET = 'whsec_test_secret'

// Signs with Stripe's own test helper, so the real signature check in
// StripeService runs instead of a mock of it.
function signedRequest(event: object, secret = WEBHOOK_SECRET) {
  const payload = JSON.stringify(event)
  const signature = new Stripe('sk_test_unused').webhooks.generateTestHeaderString({ payload, secret })
  return { req: { rawBody: Buffer.from(payload) } as never, signature }
}

describe('StripeWebhookController', () => {
  let controller: StripeWebhookController
  let ordersService: { handlePaymentIntentSucceeded: jest.Mock }
  let config: Record<string, string | undefined>

  const succeededEvent = {
    id: 'evt_1',
    object: 'event',
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_123', object: 'payment_intent', status: 'succeeded', metadata: {} } },
  }

  beforeEach(async () => {
    config = { STRIPE_SECRET_KEY: 'sk_test_unused', STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }
    ordersService = { handlePaymentIntentSucceeded: jest.fn().mockResolvedValue({ id: 1 }) }

    const module = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => config[key], getOrThrow: (key: string) => config[key] },
        },
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile()

    controller = module.get(StripeWebhookController)
  })

  it('creates the order for a correctly signed payment_intent.succeeded event', async () => {
    const { req, signature } = signedRequest(succeededEvent)

    await expect(controller.handleEvent(req, signature)).resolves.toEqual({ received: true })
    expect(ordersService.handlePaymentIntentSucceeded).toHaveBeenCalledWith(expect.objectContaining({ id: 'pi_123' }))
  })

  it('rejects an event signed with a different secret with a 400', async () => {
    const { req, signature } = signedRequest(succeededEvent, 'whsec_attacker')

    await expect(controller.handleEvent(req, signature)).rejects.toMatchObject({ status: 400 })
    expect(ordersService.handlePaymentIntentSucceeded).not.toHaveBeenCalled()
  })

  it('rejects a body changed after signing', async () => {
    const { signature } = signedRequest(succeededEvent)
    const tampered = { rawBody: Buffer.from(JSON.stringify({ ...succeededEvent, id: 'evt_forged' })) } as never

    await expect(controller.handleEvent(tampered, signature)).rejects.toMatchObject({ status: 400 })
  })

  it('returns 500 when no webhook secret is configured', async () => {
    config.STRIPE_WEBHOOK_SECRET = undefined
    const { req, signature } = signedRequest(succeededEvent)

    await expect(controller.handleEvent(req, signature)).rejects.toMatchObject({ status: 500 })
  })

  it('acknowledges other event types without creating an order', async () => {
    const { req, signature } = signedRequest({ ...succeededEvent, type: 'charge.succeeded' })

    await expect(controller.handleEvent(req, signature)).resolves.toEqual({ received: true })
    expect(ordersService.handlePaymentIntentSucceeded).not.toHaveBeenCalled()
  })

  it('acknowledges a permanent order failure so Stripe does not retry it', async () => {
    ordersService.handlePaymentIntentSucceeded.mockRejectedValue(new CustomError('Edition 10 is out of stock', 409))
    const { req, signature } = signedRequest(succeededEvent)

    await expect(controller.handleEvent(req, signature)).resolves.toEqual({ received: true })
  })

  it('returns 500 on an unexpected failure so Stripe retries', async () => {
    ordersService.handlePaymentIntentSucceeded.mockRejectedValue(new Error('connection lost'))
    const { req, signature } = signedRequest(succeededEvent)

    const error = await controller.handleEvent(req, signature).catch((caught) => caught)
    expect(error).toBeInstanceOf(HttpException)
    expect(error.getStatus()).toBe(500)
  })
})
