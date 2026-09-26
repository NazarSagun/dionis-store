import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export const DEFAULT_ORDERS_PAGE_SIZE = 5
export const MAX_ORDERS_PAGE_SIZE = 50

// Query values arrive as strings: @Type converts them for validation only,
// so the controller converts them again.
export class OrdersPageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ORDERS_PAGE_SIZE)
  pageSize?: number
}
