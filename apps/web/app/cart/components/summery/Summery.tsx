import { Button } from '@/ui'
import classes from './Summery.module.css'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { useRouter } from 'next/navigation'
import { calculateCartSummary } from './helpers'
import { useEffect, useState } from 'react'

export const Summery = () => {
  const {
    state: { cart },
  } = useGlobalState()
  const { push } = useRouter()

  const [summery, setSummery] = useState({ totalDiscount: 0, finalPrice: 0, initialPrice: 0 })

  useEffect(() => {
    const { totalDiscount, finalPrice, initialPrice } = calculateCartSummary(cart.items)
    setSummery({ totalDiscount, finalPrice, initialPrice })
  }, [cart.items])

  return (
    <div className={classes.container}>
      <div className={classes.priceContainer}>
        <div>
          <div>Official price</div>
          <div>Discount</div>
        </div>
        <div>
          <div>{summery.initialPrice}€</div>
          <div>{summery.totalDiscount}€</div>
        </div>
      </div>
      <div className={classes.subtotalContainer}>
        <div>Subtotal</div>
        <div>{summery.finalPrice.toFixed(2)}€</div>
      </div>
      <div className={classes.buttonsContainer}>
        <button disabled={cart.items.length === 0} className={classes.button}>
          Go to payment
        </button>
        <div>or</div>
        <Button variant='link' onClick={() => push('/')}>
          Continue shopping
        </Button>
      </div>
    </div>
  )
}
