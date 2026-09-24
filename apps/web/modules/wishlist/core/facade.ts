import { useWishlistStore } from './store'

export const useWishlistItems = () => useWishlistStore((state) => state.items)
export const useIsInWishlist = (id: number | undefined) =>
  useWishlistStore((state) => (id !== undefined ? state.isInWishlist(id) : false))

export const useToggleWishlistItem = () => useWishlistStore((state) => state.toggleItem)
export const useUpdateWishlistDiscountSnapshot = () => useWishlistStore((state) => state.updateDiscountSnapshot)
