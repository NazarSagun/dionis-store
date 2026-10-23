import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { RequireRole } from '../../common/decorators/roles.decorator'
import { toHttpException } from '../../common/errors/to-http-exception'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/types/roles'
import { AdminOrdersQueryDto, DEFAULT_ADMIN_ORDERS_PAGE_SIZE } from './dto/admin-orders-query.dto'
import { UpdateOrderShipmentDto } from './dto/update-order-shipment.dto'
import { OrdersService } from './orders.service'

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole(Roles.Admin)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async listOrders(@Query() query: AdminOrdersQueryDto) {
    try {
      return await this.ordersService.listAllOrders(
        query.page === undefined ? 1 : Number(query.page),
        query.pageSize === undefined ? DEFAULT_ADMIN_ORDERS_PAGE_SIZE : Number(query.pageSize),
        query.email || undefined,
      )
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Patch(':orderId')
  async updateOrderShipment(@Param('orderId') orderIdParam: string, @Body() dto: UpdateOrderShipmentDto) {
    const orderId = Number(orderIdParam)
    if (!orderIdParam || !Number.isInteger(orderId)) {
      throw toHttpException(new CustomError('Invalid order id supplied', 400))
    }

    try {
      return await this.ordersService.updateOrderShipment(orderId, dto.status, dto.trackingNumber)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
