import { WishlistItem } from '../domain/models'

import { WishlistItemObject } from './repository'

// `discount` on a WishlistItem is the snapshot the price-drop badge compares
// against, not the game's live discount.
export const toWishlistItem = (dto: WishlistItemObject): WishlistItem => ({
  id: dto.game.id,
  thumbnailUrl: dto.game.thumbnail,
  title: dto.game.title,
  price: dto.game.price,
  platform: dto.game.platform,
  rating: dto.game.rating,
  discount: dto.discountSnapshot,
  addedAt: Date.parse(dto.createdAt),
})

export const toWishlistItems = (dtos: WishlistItemObject[]) => dtos.map(toWishlistItem)
