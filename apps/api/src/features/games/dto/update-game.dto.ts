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
  ValidateIf,
} from 'class-validator'
import { GameImageDto } from './game-image.dto'
import { GameLanguageDto } from './game-language.dto'
import { GameSectionDto, SECTION_KINDS } from './game-section.dto'
import { YOUTUBE_ID } from './create-game.dto'

// Any subset of CreateGameDto's fields, with the same rules. The id cannot change.
export class UpdateGameDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  thumbnail?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  short_description?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  genre?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  platform?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  publisher?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  developer?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  release_date?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rating?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discount?: number

  // null removes the trailer.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(YOUTUBE_ID)
  trailerYoutubeId?: string | null

  // An array replaces every image of the game.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => GameImageDto)
  images?: GameImageDto[]

  // An array replaces every section of the game.
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
