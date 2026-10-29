import { IsNotEmpty, IsString, Length } from 'class-validator'

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string

  // bcrypt ignores every byte after the 72nd.
  @IsString()
  @Length(8, 72, { message: 'Password must be 8 to 72 characters' })
  password!: string
}
