import { Transform } from 'class-transformer'
import { IsString, MaxLength, MinLength } from 'class-validator'

export const MAX_REPLY_BODY_LENGTH = 500

export class CreateReplyDto {
  // The text is trimmed first, so a reply of only spaces fails MinLength.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_REPLY_BODY_LENGTH)
  body!: string
}
