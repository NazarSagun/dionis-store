import { Module } from '@nestjs/common'
import { GuardsModule } from '../common/guards/guards.module'
import { GamesController } from './games.controller'
import { GamesService } from './games.service'

@Module({
  imports: [GuardsModule],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
