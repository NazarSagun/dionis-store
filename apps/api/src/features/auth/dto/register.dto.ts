import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsEmail({}, { message: 'Invalid email' })
  email!: string

  // bcrypt ignores every byte after the 72nd.
  @IsString()
  @Length(8, 72, { message: 'Password must be 8 to 72 characters' })
  password!: string
}
