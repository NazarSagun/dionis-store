import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'
import { CustomError } from '../../common/errors/custom-error'

/**
 * Single shared Stripe client for the whole app, handed out via DI, the same
 * way PrismaService wraps PrismaClient. Never `new Stripe()` ad hoc elsewhere
 * - this is also what unit tests mock instead of hitting the network.
 */
@Injectable()
export class StripeService {
  private readonly client: Stripe

  constructor(private readonly configService: ConfigService) {
    this.client = new Stripe(this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'))
  }

  createPaymentIntent(amountCents: number, metadata: Record<string, string>) {
    return this.client.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata,
      // Explicit, instead of automatic_payment_methods (the default). This
      // Stripe test account has Link, Bancontact, and EPS active alongside
      // Card. Left automatic, Link intercepts confirmPayment with its own
      // "save my info" panel before the card is ever charged - the Payment
      // step only ever built a card form, per checkout-payment-activation-spec.md
      // Feature 1's own "payment method other than a card" out-of-scope note.
      payment_method_types: ['card'],
    })
  }

  retrievePaymentIntent(paymentIntentId: string) {
    return this.client.paymentIntents.retrieve(paymentIntentId)
  }

  updatePaymentIntentMetadata(paymentIntentId: string, metadata: Record<string, string>) {
    return this.client.paymentIntents.update(paymentIntentId, { metadata })
  }

  /**
   * Verifies Stripe's signature over the raw request body and returns the
   * parsed event. Throws Stripe's own signature error for a forged or
   * malformed request. Read at call time, not in the constructor, so the API
   * still starts on a machine that has no webhook secret yet.
   */
  constructWebhookEvent(rawBody: Buffer, signature: string) {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')
    if (!secret) {
      throw new CustomError('Stripe webhook is not configured', 500)
    }
    return this.client.webhooks.constructEvent(rawBody, signature, secret)
  }
}
