import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class GameLanguageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  language!: string

  @IsBoolean()
  audio!: boolean

  @IsBoolean()
  subtitles!: boolean

  @IsBoolean()
  interface!: boolean
}
