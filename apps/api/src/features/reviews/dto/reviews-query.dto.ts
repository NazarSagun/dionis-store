import { IsOptional, Matches } from 'class-validator'

export class ReviewsQueryDto {
  // A query value is a string here, because the global pipe does not transform.
  @IsOptional()
  @Matches(/^[1-9]\d{0,5}$/, { message: 'Invalid page number supplied' })
  page?: string
}
