import { Button } from '@/ui'
import classes from './Summery.module.css'

export const Summery = () => {
  return (
    <div className={classes.container}>
      <div>
        <div>
          <span>Official price</span>
          <span>Discount</span>
        </div>
        <div>
          <span>0</span>
          <span>0</span>
        </div>
        <div>
          <span>Subtotal</span>
          <span>0</span>
        </div>
        <Button>Go to payment</Button>
      </div>
    </div>
  )
}
