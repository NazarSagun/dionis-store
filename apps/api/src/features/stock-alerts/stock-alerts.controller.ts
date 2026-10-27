import { Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Put, Req, UseGuards } from '@nestjs/common'
import { toHttpException } from '../../common/errors/to-http-exception'
import { AuthenticatedRequest, JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { StockAlertsService } from './stock-alerts.service'

@Controller()
@UseGuards(JwtAuthGuard)
export class StockAlertsController {
  constructor(private readonly stockAlertsService: StockAlertsService) {}

  @Put('editions/:id/stock-alert')
  @HttpCode(204)
  async subscribe(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.stockAlertsService.subscribe(req.user.email, id)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Delete('editions/:id/stock-alert')
  @HttpCode(204)
  async unsubscribe(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.stockAlertsService.unsubscribe(req.user.email, id)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  // Per user, so it is never cached and has no public header.
  @Get('games/:gameId/stock-alerts')
  async list(@Req() req: AuthenticatedRequest, @Param('gameId', ParseIntPipe) gameId: number) {
    try {
      return await this.stockAlertsService.listForGame(req.user.email, gameId)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
