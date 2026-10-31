import { Transform, Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString, MaxLength } from 'class-validator'

export const ALLOWED_SHOWDOWN_SIZES = [8, 16, 32] as const
export const MAX_SHOWDOWN_GENRES = 3

export type AllowedShowdownSize = (typeof ALLOWED_SHOWDOWN_SIZES)[number]

// "?genres=A" arrives as a string and "?genres=A&genres=B" as an array.
export const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String)
  return typeof value === 'string' ? [value] : []
}

export class ShowdownQueryDto {
  @Transform(({ value }) => toStringList(value))
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SHOWDOWN_GENRES)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  genres!: string[]

  @Type(() => Number)
  @IsIn(ALLOWED_SHOWDOWN_SIZES)
  size!: AllowedShowdownSize
}
