import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { AuthenticatedRequest, JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RequireRole } from '../../common/decorators/roles.decorator'
import { Roles } from '../../common/types/roles'
import { toHttpException } from '../../common/errors/to-http-exception'
import { UsersService } from './users.service'
import { DeleteUserDto } from './dto/delete-user.dto'
import { UpdateNameDto } from './dto/update-name.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole(Roles.Admin)
  async getAllUsers() {
    try {
      return await this.usersService.findAll()
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post('user/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole(Roles.Admin)
  async removeUser(@Body() dto: DeleteUserDto) {
    try {
      await this.usersService.remove(dto.id)
      return { message: 'User deleted' }
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Patch('users/me')
  @UseGuards(JwtAuthGuard)
  async updateName(@Req() req: AuthenticatedRequest, @Body() dto: UpdateNameDto) {
    try {
      return await this.usersService.updateName(req.user.email, dto.name)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Patch('users/me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    try {
      await this.usersService.changePassword(req.user.email, dto.currentPassword, dto.newPassword)
      return { message: 'Password updated' }
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
