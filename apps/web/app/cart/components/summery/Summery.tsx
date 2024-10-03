import { Button } from '@/ui'
import classes from './Summery.module.css'
import { useGlobalState } from '@/providers/store/GlobalStateContext'

export const Summery = () => {
  const {
    state: { cart },
  } = useGlobalState()
  return (
    <div className={classes.container}>
      <div className={classes.priceContainer}>
        <div>
          <div>Official price</div>
          <div>Discount</div>
        </div>
        <div>
          <div>0</div>
          <div>0</div>
        </div>
      </div>
      <div className={classes.subtotalContainer}>
        <div>Subtotal</div>
        <div>0</div>
      </div>
      <div className={classes.buttonsContainer}>
        <button disabled={cart.items.length === 0} className={classes.button}>
          Go to payment
        </button>
        <div>or</div>
        <Button variant='link'>Continue shopping</Button>
      </div>
    </div>
  )
}
