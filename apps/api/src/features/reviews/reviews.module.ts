import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { ReviewRepliesController } from './review-replies.controller'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'

@Module({
  imports: [GuardsModule],
  controllers: [ReviewsController, ReviewRepliesController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
