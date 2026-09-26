import { Controller, Headers, HttpCode, Logger, Post, RawBodyRequest, Req } from '@nestjs/common'
import { Request } from 'express'
import Stripe from 'stripe'
import { CustomError } from '../../common/errors/custom-error'
import { toHttpException } from '../../common/errors/to-http-exception'
import { OrdersService } from './orders.service'
import { StripeService } from './stripe.service'

// Its own controller because OrdersController guards every route with a JWT.
// Stripe authenticates with a signature over the raw body instead.
@Controller('orders/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name)

  constructor(
    private readonly ordersService: OrdersService,
    private readonly stripe: StripeService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleEvent(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    let event: Stripe.Event
    try {
      event = this.stripe.constructWebhookEvent(req.rawBody as Buffer, signature)
    } catch (error) {
      throw toHttpException(error instanceof CustomError ? error : new CustomError('Invalid Stripe signature', 400))
    }

    if (event.type === 'payment_intent.succeeded') {
      try {
        await this.ordersService.handlePaymentIntentSucceeded(event.data.object)
      } catch (error) {
        // A CustomError is permanent (out of stock, unknown user, bad
        // metadata), so a Stripe retry would fail the same way. Acknowledge
        // it and leave the paid-but-no-order case to a refund. Anything else
        // returns 500, so Stripe retries later.
        if (error instanceof CustomError) {
          this.logger.error(`No order for PaymentIntent ${event.data.object.id}: ${error.message}`)
          return { received: true }
        }
        throw toHttpException(error)
      }
    }

    return { received: true }
  }
}
