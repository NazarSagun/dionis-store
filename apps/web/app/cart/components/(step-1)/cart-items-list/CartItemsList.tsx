'use client'

import { CartItem } from '@/providers/store/reducers/cartReducer'
import { CartItem as CartItemComponent } from '../cart-item/CartItem'

export interface CartItems {
  cartItems: CartItem[]
}

export const CartItemsList = ({ cartItems }: CartItems) => {
  return (
    <div className='flex flex-col gap-8 rounded-[15px] bg-[#444444d8] p-4'>
      {cartItems.map((item) => (
        <CartItemComponent key={item.id} {...item} />
      ))}
    </div>
  )
}
