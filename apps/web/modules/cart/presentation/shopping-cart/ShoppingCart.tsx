import { useCartItems } from '../../core/facade'
import { CartItemsList } from '../cart-items-list/CartItemsList'
import { EmptyState } from '../empty-state/EmptyState'
import { Summary } from '../summary/Summary'

export const ShoppingCart = () => {
  const items = useCartItems()

  return (
    <div className='mb-8 ml-4 mr-4 mt-12 flex flex-col justify-center gap-6 sm:ml-[1.8rem] sm:mr-[1.8rem] lg:flex-row'>
      <section className='w-full lg:w-[55vw]'>
        <h2 className='mb-4 font-display text-3xl text-white'>Cart</h2>
        {items.length === 0 && <EmptyState />}
        {items.length > 0 && <CartItemsList cartItems={items} />}
      </section>
      <section className='sticky bottom-0 z-10 w-full bg-background pt-2 lg:static lg:w-[30vw] lg:bg-transparent lg:pt-0'>
        <h2 className='mb-4 font-display text-3xl text-white'>Summary</h2>
        <Summary />
      </section>
    </div>
  )
}
