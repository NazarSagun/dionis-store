import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator'

export class GameImageDto {
  @IsString()
  @IsNotEmpty()
  url!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  alt!: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  position!: number
}
