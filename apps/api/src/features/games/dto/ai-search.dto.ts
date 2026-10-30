import { Transform } from 'class-transformer'
import { IsString, Length } from 'class-validator'

export const MAX_AI_QUERY_LENGTH = 200

export class AiSearchDto {
  // Trimmed first, so a query of only spaces fails the length check.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, MAX_AI_QUERY_LENGTH)
  query!: string
}
