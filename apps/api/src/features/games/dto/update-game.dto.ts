import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

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
}
