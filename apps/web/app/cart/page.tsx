'use client'

import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { EmptyState } from './components/empty-state'
import { CartItemsList } from './components/cart-items-list'
import classes from './page.module.css'
import { Summery } from './components/summery/Summery'

const Page = () => {
  const {
    state: { cart },
  } = useGlobalState()

  console.log(cart)
  return (
    <div className={classes.container}>
      <section>
        <h2>Cart</h2>
        {cart.items.length === 0 && <EmptyState />}
        {cart.items.length > 0 && <CartItemsList cartItems={cart.items} />}
      </section>
      <section>
        <h2>Summery</h2>
        <Summery />
      </section>
    </div>
  )
}

export default Page
