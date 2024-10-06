import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { EmptyState, CartItemsList, Summary } from '..'

export const ShoppingCart = () => {
  const {
    state: { cart },
  } = useGlobalState()

  return (
    <div>
      <section>
        <h2>Cart</h2>
        {cart.items.length === 0 && <EmptyState />}
        {cart.items.length > 0 && <CartItemsList cartItems={cart.items} />}
      </section>
      <section>
        <h2>Summary</h2>
        <Summary />
      </section>
    </div>
  )
}
