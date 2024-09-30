'use client'

import { CartItem } from '@/providers/store/reducers/cartReducer'
import { EmptyState } from '../empty-state'

export interface CartItems {
  cartItems: CartItem[]
}

export const CartItemsList = ({ cartItems }: CartItems) => {
  return (
    <div>
      {cartItems.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  )
}
