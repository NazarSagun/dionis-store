import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './common/prisma/prisma.module'
import { AuthModule } from './features/auth/auth.module'
import { UsersModule } from './features/users/users.module'
import { GamesModule } from './features/games/games.module'
import { OrdersModule } from './features/orders/orders.module'
import { WishlistModule } from './features/wishlist/wishlist.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GamesModule,
    OrdersModule,
    WishlistModule,
  ],
})
export class AppModule {}
