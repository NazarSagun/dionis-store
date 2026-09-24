'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { CartItem, isSameLine } from '../domain/models'

interface CartState {
  items: CartItem[]
  currentStep: number
  orderId: number | null
  isDrawerOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: number, editionId: number | null) => void
  updateItemQuantity: (id: number, editionId: number | null, quantity: number) => void
  setStep: (step: number) => void
  setOrderId: (orderId: number | null) => void
  openDrawer: () => void
  closeDrawer: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      currentStep: 1,
      orderId: null,
      isDrawerOpen: false,
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id, editionId) =>
        set((state) => ({ items: state.items.filter((item) => !isSameLine(item, id, editionId)) })),
      updateItemQuantity: (id, editionId, quantity) =>
        set((state) => ({
          items: state.items.map((item) => (isSameLine(item, id, editionId) ? { ...item, quantity } : item)),
        })),
      setStep: (step) => set({ currentStep: step }),
      setOrderId: (orderId) => set({ orderId }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
