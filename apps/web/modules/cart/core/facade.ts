import { useCartStore } from './store'

export const useCartItems = () => useCartStore((state) => state.items)
export const useCartStep = () => useCartStore((state) => state.currentStep)
export const useCartOrderId = () => useCartStore((state) => state.orderId)

export const useAddCartItem = () => useCartStore((state) => state.addItem)
export const useRemoveCartItem = () => useCartStore((state) => state.removeItem)
export const useUpdateCartItemQuantity = () => useCartStore((state) => state.updateItemQuantity)
export const useSetCartStep = () => useCartStore((state) => state.setStep)
export const useSetCartOrderId = () => useCartStore((state) => state.setOrderId)
