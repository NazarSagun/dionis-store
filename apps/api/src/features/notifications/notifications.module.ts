import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'

@Module({
  imports: [GuardsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
