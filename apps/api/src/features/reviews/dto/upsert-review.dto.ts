import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export const MAX_REVIEW_BODY_LENGTH = 1000

export class UpsertReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(MAX_REVIEW_BODY_LENGTH)
  body?: string
}
