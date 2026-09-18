import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsEmail({}, { message: 'Invalid email' })
  email!: string

  @IsString()
  @IsNotEmpty()
  password!: string
}
