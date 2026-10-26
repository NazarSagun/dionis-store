import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { OrderStatus } from '@prisma/client'

export const ORDER_STATUSES = Object.values(OrderStatus)

export class UpdateOrderShipmentDto {
  @IsIn(ORDER_STATUSES)
  status: OrderStatus

  // Trimmed by the service. An empty string clears the stored value.
  @IsOptional()
  @IsString()
  @MaxLength(64)
  trackingNumber?: string
}
