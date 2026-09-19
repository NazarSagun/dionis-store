import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { StripeService } from './stripe.service'

@Module({
  imports: [GuardsModule],
  controllers: [OrdersController],
  providers: [OrdersService, StripeService],
})
export class OrdersModule {}
