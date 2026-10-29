import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import { GameImageDto } from './game-image.dto'
import { GameLanguageDto } from './game-language.dto'
import { GameSectionDto, SECTION_KINDS } from './game-section.dto'

// A YouTube video id: 11 characters from the URL-safe base64 alphabet.
export const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/

export class CreateGameDto {
  // Only the seed script sends an id, to keep the FreeToGame ids. The admin
  // panel leaves it out and the database assigns the next one.
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  thumbnail!: string

  @IsString()
  @IsNotEmpty()
  short_description!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  genre!: string

  @IsString()
  @IsNotEmpty()
  platform!: string

  @IsString()
  @IsNotEmpty()
  publisher!: string

  @IsString()
  @IsNotEmpty()
  developer!: string

  @IsString()
  @IsNotEmpty()
  release_date!: string

  @IsInt()
  @Min(0)
  price!: number

  @IsString()
  @IsNotEmpty()
  rating!: string

  @IsInt()
  @Min(0)
  @Max(100)
  discount!: number

  @IsOptional()
  @Matches(YOUTUBE_ID)
  trailerYoutubeId?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => GameImageDto)
  images?: GameImageDto[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SECTION_KINDS.length)
  @ValidateNested({ each: true })
  @Type(() => GameSectionDto)
  sections?: GameSectionDto[]

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  coverUrl?: string

  // PEGI and ESRB labels, such as "PEGI 12" and "ESRB T".
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @Matches(/^(PEGI|ESRB) \S{1,10}$/, { each: true })
  ageRatings?: string[]

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  criticRating?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  criticRatingCount?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  userRating?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  userRatingCount?: number

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => GameLanguageDto)
  languages?: GameLanguageDto[]
}
