'use client'

import { CartItem } from '@/providers/store/reducers/cartReducer'
import classes from './CartItemsList.module.css'
import { CartItem as CartItemComponent } from '../cart-item/CartItem'

export interface CartItems {
  cartItems: CartItem[]
}

export const CartItemsList = ({ cartItems }: CartItems) => {
  return (
    <div className={classes.container}>
      {cartItems.map((item) => (
        <CartItemComponent key={item.id} {...item} />
      ))}
    </div>
  )
}
