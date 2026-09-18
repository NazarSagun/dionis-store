import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

export const ALLOWED_PLATFORMS = ['PC', 'PS5', 'Xbox', 'Switch'] as const
export const ALLOWED_SORTS = ['price_asc', 'price_desc', 'rating_desc'] as const

export type AllowedPlatform = (typeof ALLOWED_PLATFORMS)[number]
export type AllowedSort = (typeof ALLOWED_SORTS)[number]

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
}
