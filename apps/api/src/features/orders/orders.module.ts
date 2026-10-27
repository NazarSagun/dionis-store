import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { PromoCodesModule } from '../promo-codes/promo-codes.module'
import { AdminOrdersController } from './admin-orders.controller'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { StripeService } from './stripe.service'
import { StripeWebhookController } from './stripe-webhook.controller'

@Module({
  imports: [GuardsModule, PromoCodesModule],
  controllers: [OrdersController, StripeWebhookController, AdminOrdersController],
  providers: [OrdersService, StripeService],
})
export class OrdersModule {}
