import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { RequireRole } from '../common/decorators/roles.decorator'
import { Roles } from '../common/types/roles'
import { toHttpException } from '../common/errors/to-http-exception'
import { UsersService } from './users.service'
import { DeleteUserDto } from './dto/delete-user.dto'

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole(Roles.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  async getAllUsers() {
    try {
      return await this.usersService.findAll()
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post('user/delete')
  async removeUser(@Body() dto: DeleteUserDto) {
    try {
      await this.usersService.remove(dto.id)
      return { message: 'User deleted' }
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
