import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'

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
}
