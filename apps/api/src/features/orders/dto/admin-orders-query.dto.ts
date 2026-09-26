import { IsOptional, IsString, MaxLength } from 'class-validator'

import { OrdersPageQueryDto } from './orders-page-query.dto'

export const DEFAULT_ADMIN_ORDERS_PAGE_SIZE = 20

export class AdminOrdersQueryDto extends OrdersPageQueryDto {
  // A case-insensitive "contains" match on the customer's email.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string
}
