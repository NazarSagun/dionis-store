import { Module } from '@nestjs/common'
import { GuardsModule } from '../../common/guards/guards.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [GuardsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
