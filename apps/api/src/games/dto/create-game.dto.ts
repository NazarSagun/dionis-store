import { IsInt, IsNotEmpty, IsString } from 'class-validator'

export class CreateGameDto {
  @IsInt()
  id: number

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  thumbnail: string

  @IsString()
  @IsNotEmpty()
  short_description: string

  @IsString()
  @IsNotEmpty()
  game_url: string

  @IsString()
  @IsNotEmpty()
  genre: string

  @IsString()
  @IsNotEmpty()
  platform: string

  @IsString()
  @IsNotEmpty()
  publisher: string

  @IsString()
  @IsNotEmpty()
  developer: string

  @IsString()
  @IsNotEmpty()
  release_date: string

  @IsString()
  @IsNotEmpty()
  freetogame_profile_url: string

  @IsInt()
  price: number

  @IsString()
  @IsNotEmpty()
  rating: string

  @IsInt()
  discount: number
}
