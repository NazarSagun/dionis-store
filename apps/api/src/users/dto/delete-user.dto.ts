import { IsInt } from 'class-validator'

export class DeleteUserDto {
  @IsInt()
  id: number
}
