'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

const isSameLine = (item: CartItem, id: number, editionId: number | null) =>
  item.id === id && item.editionId === editionId

interface CartState {
  items: CartItem[]
  currentStep: number
  orderId: number | null
  addItem: (item: CartItem) => void
  removeItem: (id: number, editionId: number | null) => void
  updateItemQuantity: (id: number, editionId: number | null, quantity: number) => void
  setStep: (step: number) => void
  setOrderId: (orderId: number | null) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      currentStep: 1,
      orderId: null,
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id, editionId) =>
        set((state) => ({ items: state.items.filter((item) => !isSameLine(item, id, editionId)) })),
      updateItemQuantity: (id, editionId, quantity) =>
        set((state) => ({
          items: state.items.map((item) => (isSameLine(item, id, editionId) ? { ...item, quantity } : item)),
        })),
      setStep: (step) => set({ currentStep: step }),
      setOrderId: (orderId) => set({ orderId }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
