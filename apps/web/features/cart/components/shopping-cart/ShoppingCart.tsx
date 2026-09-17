import { useCartStore } from '../../store/useCartStore'
import { EmptyState, CartItemsList, Summary } from '..'

export const ShoppingCart = () => {
  const items = useCartStore((state) => state.items)

  return (
    <div className='mb-8 ml-[1.8rem] mr-[1.8rem] mt-12 flex justify-center gap-6'>
      <section className='w-[55vw]'>
        <h2 className='mb-4 text-2xl font-bold text-foreground'>Cart</h2>
        {items.length === 0 && <EmptyState />}
        {items.length > 0 && <CartItemsList cartItems={items} />}
      </section>
      <section className='w-[30vw]'>
        <h2 className='mb-4 text-2xl font-bold text-foreground'>Summary</h2>
        <Summary />
      </section>
    </div>
  )
}
