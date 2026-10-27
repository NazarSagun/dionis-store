import { Transform, Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Max, Min } from 'class-validator'

export const MAX_SEED_IDS = 30
export const MAX_EXCLUDE_IDS = 60
export const DEFAULT_RECOMMENDATIONS_LIMIT = 6
export const MAX_RECOMMENDATIONS_LIMIT = 12

// "1,2,3" to [1, 2, 3]. A part that is not a number becomes NaN, which fails @IsInt. With whitelist on,
// the ValidationPipe hands the controller the transformed query, so the controller gets an array here
// and a raw string in a test. Both give the same list.
export const parseIdList = (value: unknown): number[] => {
  if (Array.isArray(value)) return value.map(Number)
  return typeof value === 'string' && value !== ''
    ? value.split(',').map((id) => (id.trim() === '' ? NaN : Number(id)))
    : []
}

export class RecommendationsQueryDto {
  @Transform(({ value }) => parseIdList(value))
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SEED_IDS)
  @IsInt({ each: true })
  @Min(1, { each: true })
  seedGameIds!: number[]

  @IsOptional()
  @Transform(({ value }) => parseIdList(value))
  @IsArray()
  @ArrayMaxSize(MAX_EXCLUDE_IDS)
  @IsInt({ each: true })
  @Min(1, { each: true })
  excludeGameIds?: number[]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RECOMMENDATIONS_LIMIT)
  limit?: number
}
