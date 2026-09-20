'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WishlistItem = {
  id: number
  thumbnailUrl: string
  title: string
  price: number
  platform: string
  rating: string
  discount: number
  addedAt: number
}

interface WishlistState {
  items: WishlistItem[]
  isInWishlist: (id: number) => boolean
  toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  updateDiscountSnapshot: (id: number, discount: number) => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isInWishlist: (id) => get().items.some((item) => item.id === id),
      toggleItem: (item) =>
        set((state) => {
          if (state.items.some((existing) => existing.id === item.id)) {
            return { items: state.items.filter((existing) => existing.id !== item.id) }
          }
          return { items: [{ ...item, addedAt: Date.now() }, ...state.items] }
        }),
      updateDiscountSnapshot: (id, discount) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, discount } : item)),
        })),
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
