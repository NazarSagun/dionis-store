import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class CreateEditionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @IsInt()
  @Min(0)
  price: number

  @IsInt()
  @Min(0)
  @Max(100)
  discount: number

  @IsInt()
  @Min(0)
  stock: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string
}

export class UpdateEditionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discount?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description?: string
}
