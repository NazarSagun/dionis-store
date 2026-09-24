import { useCartItems } from '../../core/facade'
import { CartItemsList } from '../cart-items-list/CartItemsList'
import { EmptyState } from '../empty-state/EmptyState'
import { Summary } from '../summary/Summary'

export const ShoppingCart = () => {
  const items = useCartItems()

  return (
    <div className='mb-8 ml-[1.8rem] mr-[1.8rem] mt-12 flex justify-center gap-6'>
      <section className='w-[55vw]'>
        <h2 className='mb-4 font-display text-3xl text-white'>Cart</h2>
        {items.length === 0 && <EmptyState />}
        {items.length > 0 && <CartItemsList cartItems={items} />}
      </section>
      <section className='w-[30vw]'>
        <h2 className='mb-4 font-display text-3xl text-white'>Summary</h2>
        <Summary />
      </section>
    </div>
  )
}
