import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { AuthenticatedRequest, JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CustomError } from '../../common/errors/custom-error'
import { toHttpException } from '../../common/errors/to-http-exception'
import { OrdersService } from './orders.service'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { ConfirmOrderDto } from './dto/confirm-order.dto'

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('payment-intent')
  async createPaymentIntent(@Req() req: AuthenticatedRequest, @Body() dto: CreatePaymentIntentDto) {
    try {
      return await this.ordersService.createPaymentIntent(req.user.email, dto.items)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post('confirm')
  async confirmOrder(@Req() req: AuthenticatedRequest, @Body() dto: ConfirmOrderDto) {
    try {
      return await this.ordersService.confirmOrder(req.user.email, dto.paymentIntentId, dto.shippingAddress)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Get()
  async getOrders(@Req() req: AuthenticatedRequest) {
    try {
      return await this.ordersService.getOrders(req.user.email)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Get(':orderId')
  async getOrder(@Req() req: AuthenticatedRequest, @Param('orderId') orderIdParam: string) {
    const orderId = Number(orderIdParam)
    if (!orderIdParam || isNaN(orderId)) {
      throw toHttpException(new CustomError('Invalid order id supplied', 400))
    }

    try {
      return await this.ordersService.getOrder(req.user.email, orderId)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Patch(':orderId/items/:itemId/activate')
  async activateOrderItem(
    @Req() req: AuthenticatedRequest,
    @Param('orderId') orderIdParam: string,
    @Param('itemId') itemIdParam: string,
  ) {
    const orderId = Number(orderIdParam)
    const itemId = Number(itemIdParam)
    if (!orderIdParam || isNaN(orderId) || !itemIdParam || isNaN(itemId)) {
      throw toHttpException(new CustomError('Invalid order or item id supplied', 400))
    }

    try {
      return await this.ordersService.activateOrderItem(req.user.email, orderId, itemId)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
