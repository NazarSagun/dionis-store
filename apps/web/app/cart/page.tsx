'use client'

import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { EmptyState } from './components/empty-state'
import { CartItemsList } from './components/cart-items-list'
import classes from './page.module.css'
import { Summary } from './components/summary/Summary'

const Page = () => {
  const {
    state: { cart },
  } = useGlobalState()

  return (
    <div className={classes.container}>
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

export default Page
