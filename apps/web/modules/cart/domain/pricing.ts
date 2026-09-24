import { CartItem } from './models'

interface CartSummary {
  initialPrice: number
  totalDiscount: number
  finalPrice: number
}

export function calculateCartSummary(cartItems: CartItem[]): CartSummary {
  return cartItems.reduce<CartSummary>(
    (summary, item) => {
      const itemTotalPrice = item.price * item.quantity
      const discountAmount = (itemTotalPrice * item.discount) / 100
      const priceAfterDiscount = itemTotalPrice - discountAmount

      summary.initialPrice += itemTotalPrice
      summary.totalDiscount += discountAmount
      summary.finalPrice += priceAfterDiscount

      return summary
    },
    { initialPrice: 0, totalDiscount: 0, finalPrice: 0 },
  )
}
