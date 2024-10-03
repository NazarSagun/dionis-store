import { CartItem as CartItemProps } from '@/providers/store/reducers/cartReducer'
import Image from 'next/image'
import classes from './CartItem.module.css'
import { calculateDiscountedPrice } from '@/app/(shop)/game/helpers'

export const CartItem = ({ title, thumbnailUrl, price, quantity, platform, discount }: CartItemProps) => {
  return (
    <div className={classes.container}>
      <Image className={classes.itemImage} width={190} height={108} alt={title} src={thumbnailUrl} />
      <div className={classes.wrapper}>
        <div>
          <h3>{title}</h3>
          <span>{platform}</span>
        </div>
        <div className={classes.actionWrapper}>
          <Image width={24} height={24} alt='delete item' src='/icons/trash-can.svg' />
          <span>Move to Wishlist</span>
        </div>
      </div>
      <div>
        <span>{calculateDiscountedPrice(price, discount)}€</span>
      </div>
    </div>
  )
}
