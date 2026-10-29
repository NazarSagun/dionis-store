import { Type } from 'class-transformer'
import { IsIn, IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator'

export const SECTION_KINDS = ['about', 'story', 'features'] as const
export type SectionKind = (typeof SECTION_KINDS)[number]

export class GameSectionDto {
  @IsIn(SECTION_KINDS)
  kind!: SectionKind

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body!: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  position!: number
}
