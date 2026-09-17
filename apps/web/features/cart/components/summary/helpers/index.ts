import { CartItem } from '../../../store/useCartStore'

interface Summary {
  initialPrice: number
  totalDiscount: number
  finalPrice: number
}

export function calculateCartSummary(cartItems: CartItem[]): Summary {
  return cartItems.reduce<Summary>(
    (summary, item) => {
      const itemTotalPrice = item.price * item.quantity
      const discountAmount = (itemTotalPrice * item.discount) / 100
      const priceAfterDiscount = itemTotalPrice - discountAmount

      summary.initialPrice += itemTotalPrice
      summary.totalDiscount += discountAmount
      summary.finalPrice += priceAfterDiscount

      return summary
    },
    { initialPrice: 0, totalDiscount: 0, finalPrice: 0 }
  )
}
