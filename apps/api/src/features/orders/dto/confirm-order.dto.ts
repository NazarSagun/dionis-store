import { IsNotEmpty, IsString } from 'class-validator'

export class ConfirmOrderDto {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string
}
