import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export const ALLOWED_PLATFORMS = ['PC', 'PS5', 'Xbox', 'Switch'] as const
export const ALLOWED_SORTS = ['price_asc', 'price_desc', 'rating_desc'] as const
export const ALLOWED_EDITIONS = ['digital', 'standard', 'collector'] as const

export type AllowedPlatform = (typeof ALLOWED_PLATFORMS)[number]
export type AllowedSort = (typeof ALLOWED_SORTS)[number]
export type AllowedEdition = (typeof ALLOWED_EDITIONS)[number]

export class GamesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string

  @IsOptional()
  @IsIn(ALLOWED_PLATFORMS)
  platform?: AllowedPlatform

  @IsOptional()
  @IsIn(ALLOWED_SORTS)
  sort?: AllowedSort

  @IsOptional()
  @IsIn(ALLOWED_EDITIONS)
  edition?: AllowedEdition

  // Exact match on Game_pc.genre, one of the values GET games/genres returns.
  @IsOptional()
  @IsString()
  @MaxLength(50)
  genre?: string

  // Whole euros, compared with the discounted price a card shows. Query
  // values arrive as strings: @Type converts them for validation only, so
  // the controller converts them again.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number
}
