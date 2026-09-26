import { useCallback } from 'react'
import { useToast } from '@repo/ui'

import { useIsAuthenticated } from '@/modules/auth/core/facade'

import { WishlistItem } from '../domain/models'

import { acknowledgeDiscount, toggleWishlistItem } from './actions/accountSync'
import { useWishlistStore } from './store'

export const useWishlistItems = () => useWishlistStore((state) => state.items)
export const useIsInWishlist = (id: number | undefined) =>
  useWishlistStore((state) => (id !== undefined ? state.isInWishlist(id) : false))

export const useToggleWishlistItem = () => {
  const isAuthenticated = useIsAuthenticated()
  const { toast } = useToast()

  return useCallback(
    (item: Omit<WishlistItem, 'addedAt'>) =>
      toggleWishlistItem(item, isAuthenticated).catch(() =>
        toast({ variant: 'destructive', title: 'Could not update your wishlist. Please try again.' }),
      ),
    [isAuthenticated, toast],
  )
}

export const useUpdateWishlistDiscountSnapshot = () => {
  const isAuthenticated = useIsAuthenticated()

  return useCallback(
    (id: number, discount: number) => acknowledgeDiscount(id, discount, isAuthenticated),
    [isAuthenticated],
  )
}
