export type CartItem = {
  id: number
  editionId: number | null
  editionName?: string
  thumbnailUrl: string
  title: string
  price: number
  platform: string
  quantity: number
  discount: number
}

export const isSameLine = (item: CartItem, id: number, editionId: number | null) =>
  item.id === id && item.editionId === editionId
