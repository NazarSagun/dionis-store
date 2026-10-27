import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { AdminPromoCodesController } from './admin-promo-codes.controller'
import { PromoCodesService } from './promo-codes.service'

@Module({
  imports: [GuardsModule],
  controllers: [AdminPromoCodesController],
  providers: [PromoCodesService],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}
