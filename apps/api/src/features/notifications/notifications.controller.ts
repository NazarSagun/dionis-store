import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { toHttpException } from '../../common/errors/to-http-exception'
import { AuthenticatedRequest, JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { NotificationsService } from './notifications.service'

function parseNotificationId(idParam: string) {
  const id = Number(idParam)
  if (!idParam || !Number.isInteger(id) || id <= 0) {
    throw toHttpException(new CustomError('Invalid notification id or type supplied', 400))
  }
  return id
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    try {
      return await this.notificationsService.list(req.user.email)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post('read-all')
  @HttpCode(204)
  async readAll(@Req() req: AuthenticatedRequest) {
    try {
      await this.notificationsService.markAllRead(req.user.email)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post(':id/read')
  @HttpCode(204)
  async read(@Req() req: AuthenticatedRequest, @Param('id') idParam: string) {
    const id = parseNotificationId(idParam)
    try {
      await this.notificationsService.markRead(req.user.email, id)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
