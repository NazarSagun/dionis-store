import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  shippingName: string

  @IsString()
  @IsNotEmpty()
  shippingLine1: string

  @IsOptional()
  @IsString()
  shippingLine2?: string

  @IsString()
  @IsNotEmpty()
  shippingCity: string

  @IsString()
  @IsNotEmpty()
  shippingPostalCode: string

  @IsString()
  @IsNotEmpty()
  shippingCountry: string
}
