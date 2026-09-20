'use client'

import { CartItem } from '../../store/useCartStore'
import { CartItemRow } from '../cart-item/CartItemRow'

export interface CartItems {
  cartItems: CartItem[]
}

export const CartItemsList = ({ cartItems }: CartItems) => {
  return (
    <div className='flex flex-col gap-6 rounded-md border-2 border-ink bg-panel-alt p-4'>
      {cartItems.map((item, index) => (
        <div key={`${item.id}-${item.editionId}`} className={index > 0 ? 'border-t-2 border-ink pt-6' : ''}>
          <CartItemRow {...item} />
        </div>
      ))}
    </div>
  )
}
