import { ArrayNotEmpty, IsArray } from 'class-validator'

export class CreatePaymentIntentDto {
  @IsArray()
  @ArrayNotEmpty()
  items: Array<{ gameId: number; quantity: number; editionId?: number | null }>
}
