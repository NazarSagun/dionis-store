import { Button } from '@/ui'
import classes from './Summery.module.css'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { useRouter } from 'next/navigation'

export const Summery = () => {
  const {
    state: { cart },
  } = useGlobalState()
  const { push } = useRouter()
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
        <button type='button' disabled={cart.items.length === 0} className={classes.button}>
          Go to payment
        </button>
        <div>or</div>
        <Button type='button' variant='link' onClick={() => push('/')}>
          Continue shopping
        </Button>
      </div>
    </div>
  )
}
