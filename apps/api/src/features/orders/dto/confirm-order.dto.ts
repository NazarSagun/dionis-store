import { Type } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ShippingAddressDto } from './shipping-address.dto'

export class ConfirmOrderDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto
}
