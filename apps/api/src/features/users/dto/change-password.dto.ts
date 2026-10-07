import { IsNotEmpty, IsString, Length } from 'class-validator'

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string

  // bcrypt ignores every byte after the 72nd.
  @IsString()
  @Length(8, 72, { message: 'Password must be 8 to 72 characters' })
  newPassword: string
}
