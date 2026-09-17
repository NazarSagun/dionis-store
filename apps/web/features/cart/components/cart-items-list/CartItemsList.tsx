'use client'

import { CartItem } from '../../store/useCartStore'
import { CartItemRow } from '../cart-item/CartItemRow'

export interface CartItems {
  cartItems: CartItem[]
}

export const CartItemsList = ({ cartItems }: CartItems) => {
  return (
    <div className='flex flex-col gap-8 rounded-[15px] bg-[#444444d8] p-4'>
      {cartItems.map((item) => (
        <CartItemRow key={item.id} {...item} />
      ))}
    </div>
  )
}
