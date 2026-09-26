import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

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
  @MaxLength(50)
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
  @Min(0)
  price: number

  @IsString()
  @IsNotEmpty()
  rating: string

  @IsInt()
  @Min(0)
  @Max(100)
  discount: number
}
