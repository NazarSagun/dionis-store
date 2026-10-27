import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { StockAlertsController } from './stock-alerts.controller'
import { StockAlertsService } from './stock-alerts.service'

@Module({
  imports: [GuardsModule],
  controllers: [StockAlertsController],
  providers: [StockAlertsService],
  exports: [StockAlertsService],
})
export class StockAlertsModule {}
