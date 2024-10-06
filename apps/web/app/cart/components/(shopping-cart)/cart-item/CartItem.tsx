import { CartItem as CartItemProps } from '@/providers/store/reducers/cartReducer'
import Image from 'next/image'
import classes from './CartItem.module.css'
import { calculateDiscountedPrice } from '@/app/(shop)/game/helpers'
import { Select } from '@/ui/atoms/select'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { CartActionType } from '@/providers/store/actions'

export const CartItem = ({ title, thumbnailUrl, price, quantity, platform, discount, id }: CartItemProps) => {
  const { dispatch } = useGlobalState()
  return (
    <div className={classes.container}>
      <Image className={classes.itemImage} width={190} height={108} alt={title} src={thumbnailUrl} />
      <div className={classes.wrapper}>
        <div>
          <h3>{title}</h3>
          <span>{platform}</span>
        </div>
        <div className={classes.actionWrapper}>
          <button onClick={() => dispatch({ type: CartActionType.REMOVE_ITEM, payload: { id } })}>
            <Image width={24} height={24} alt='delete item' src='/icons/trash-can.svg' />
          </button>
          <button onClick={() => console.log(id)}>Move to Wishlist</button>
        </div>
      </div>
      <div className={classes.selectContainer}>
        <span>{calculateDiscountedPrice(price, discount)}€</span>

        <Select
          onChange={(number) =>
            dispatch({ type: CartActionType.UPDATE_ITEM_QUANTITY, payload: { id, quantity: number } })
          }
          selectedOption={quantity}
        />
      </div>
    </div>
  )
}
