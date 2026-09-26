import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

// Each field becomes one Stripe metadata value, which holds at most 500
// characters. 200 is far above any real address line.
const MAX_FIELD_LENGTH = 200

export class ShippingAddressDto {
  @IsString()
  @MaxLength(MAX_FIELD_LENGTH)
  @IsNotEmpty()
  shippingName: string

  @IsString()
  @MaxLength(MAX_FIELD_LENGTH)
  @IsNotEmpty()
  shippingLine1: string

  @IsOptional()
  @IsString()
  @MaxLength(MAX_FIELD_LENGTH)
  shippingLine2?: string

  @IsString()
  @MaxLength(MAX_FIELD_LENGTH)
  @IsNotEmpty()
  shippingCity: string

  @IsString()
  @MaxLength(MAX_FIELD_LENGTH)
  @IsNotEmpty()
  shippingPostalCode: string

  @IsString()
  @MaxLength(MAX_FIELD_LENGTH)
  @IsNotEmpty()
  shippingCountry: string
}
