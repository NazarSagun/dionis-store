import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { StockAlertsModule } from '../stock-alerts/stock-alerts.module'
import { AiSearchService } from './ai-search.service'
import { GamesController } from './games.controller'
import { GamesService } from './games.service'

@Module({
  imports: [GuardsModule, StockAlertsModule],
  controllers: [GamesController],
  providers: [GamesService, AiSearchService],
})
export class GamesModule {}
