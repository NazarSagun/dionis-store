import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { MailModule } from './common/mail/mail.module'
import { PrismaModule } from './common/prisma/prisma.module'
import { shouldSkipThrottle } from './common/throttle/skip-throttle'
import { AuthModule } from './features/auth/auth.module'
import { UsersModule } from './features/users/users.module'
import { GamesModule } from './features/games/games.module'
import { NotificationsModule } from './features/notifications/notifications.module'
import { OrdersModule } from './features/orders/orders.module'
import { ReviewsModule } from './features/reviews/reviews.module'
import { WishlistModule } from './features/wishlist/wishlist.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 300 requests a minute per client IP for every route. RATE_LIMIT=off turns it
    // off, for the E2E run, whose tests sign up many users from one address.
    // A request with the RATE_LIMIT_BYPASS_TOKEN in X-Load-Test-Token skips it too.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
      skipIf: (context) => shouldSkipThrottle(context),
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    GamesModule,
    OrdersModule,
    WishlistModule,
    ReviewsModule,
    NotificationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
