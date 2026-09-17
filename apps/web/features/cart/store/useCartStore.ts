'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: number
  thumbnailUrl: string
  title: string
  price: number
  platform: string
  quantity: number
  discount: number
}

interface CartState {
  items: CartItem[]
  currentStep: number
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateItemQuantity: (id: number, quantity: number) => void
  setStep: (step: number) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      currentStep: 1,
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      updateItemQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        })),
      setStep: (step) => set({ currentStep: step }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
