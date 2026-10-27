import { IsDateString, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator'

export class CreatePromoCodeDto {
  // Stored in uppercase. Letters, digits, and hyphens only, so a code is safe in a URL and an email.
  @IsString()
  @Matches(/^[A-Za-z0-9-]{3,32}$/, { message: 'code must be 3 to 32 letters, digits, or hyphens' })
  code!: string

  @IsInt()
  @Min(1)
  @Max(100)
  percentOff!: number

  @IsOptional()
  @IsDateString()
  expiresAt?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number
}
