import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator'

export class GuestWishlistItemDto {
  @IsInt()
  gameId: number

  // The discount the guest saw when adding the game. Kept as the snapshot,
  // so a price drop since then still shows the badge after login.
  @IsInt()
  @Min(0)
  @Max(100)
  discount: number

  // Milliseconds since the epoch, from the guest wishlist's addedAt.
  @IsOptional()
  @IsInt()
  addedAt?: number
}

export class MergeWishlistDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => GuestWishlistItemDto)
  items: GuestWishlistItemDto[]
}
