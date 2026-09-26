import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { WishlistController } from './wishlist.controller'
import { WishlistService } from './wishlist.service'

@Module({
  imports: [GuardsModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
