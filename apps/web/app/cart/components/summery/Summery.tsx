import { Button } from '@/ui'
import classes from './Summery.module.css'

export const Summery = () => {
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
        <Button>Go to payment</Button>
        <div>or</div>
        <Button variant='link'>Continue shopping</Button>
      </div>
    </div>
  )
}
