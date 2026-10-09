import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'

@Module({
  imports: [GuardsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
