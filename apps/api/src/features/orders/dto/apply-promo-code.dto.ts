import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class ApplyPromoCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code!: string
}
