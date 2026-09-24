import Image from 'next/image'

import { cn } from '@/lib/utils'
import { calculateDiscountedPrice } from '@/modules/games/domain/pricing'

import { useRemoveCartItem, useUpdateCartItemQuantity } from '../../core/facade'
import { CartItem as CartItemProps } from '../../domain/models'
import { QuantitySelect } from '../quantity-select/QuantitySelect'

const dividerAfter =
  "relative after:absolute after:left-[23%] after:top-1/2 after:h-[80%] after:w-px after:-translate-y-1/2 after:bg-muted-foreground/40 after:content-[''] after:pointer-events-none"

export const CartItemRow = ({
  title,
  thumbnailUrl,
  price,
  quantity,
  platform,
  discount,
  id,
  editionId,
  editionName,
}: CartItemProps) => {
  const removeItem = useRemoveCartItem()
  const updateItemQuantity = useUpdateCartItemQuantity()
  return (
    <div data-testid='cart-item' className='flex gap-4'>
      <Image className='rounded-md border border-ink' width={190} height={108} alt={title} src={thumbnailUrl} />
      <div className='flex flex-col justify-between py-[0.1rem]'>
        <div>
          <h3 className='font-mono text-xl font-bold text-foreground'>{title}</h3>
          <span className='font-mono text-[0.8rem] text-muted-foreground'>{platform}</span>
          {editionId !== null && (
            <span data-testid='cart-item-edition' className='block font-mono text-[0.8rem] text-neon-cyan'>
              {editionName}
            </span>
          )}
        </div>
        <div className='flex items-center gap-4'>
          <button
            className={cn(dividerAfter, 'font-mono text-[0.8rem] text-foreground')}
            onClick={() => removeItem(id, editionId)}
          >
            <Image width={24} height={24} alt='delete item' src='/icons/trash-can.svg' />
          </button>
          <button
            className={cn(dividerAfter, 'font-mono text-[0.8rem] text-foreground')}
            onClick={() => console.log(id)}
          >
            Move to Wishlist
          </button>
        </div>
      </div>
      <div className='ml-auto flex items-center'>
        <span className='mr-4 font-display text-sm text-neon-amber'>{calculateDiscountedPrice(price, discount)}€</span>

        <QuantitySelect onChange={(number) => updateItemQuantity(id, editionId, number)} selectedOption={quantity} />
      </div>
    </div>
  )
}
