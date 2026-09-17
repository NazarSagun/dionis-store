'use client'

import { useGetGame } from '@repo/dionis-api/src/dionis/default/default'
import { cn } from '@/lib/utils'
import { Loader, useToast } from '@/ui'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { calculateDiscountedPrice } from '../helpers'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { CartActionType } from '@/providers/store/actions'
import { CartItem } from '@/providers/store/reducers/cartReducer'

const buttonStyles =
  "flex items-center gap-2 rounded-[10px] border-0 bg-[linear-gradient(45deg,#ff512f_0%,#f09819_51%,#ff512f_100%)] bg-[length:200%_auto] px-[30px] py-[15px] text-white shadow-[0px_0px_14px_-7px_#f09819] transition-[background-position] duration-500 select-none touch-manipulation hover:bg-right active:scale-95"

export default function GamePage() {
  const {
    state: { cart },
    dispatch,
  } = useGlobalState()

  const { toast } = useToast()

  const { id } = useParams()

  const { data, isLoading } = useGetGame(Number(id))

  const addGameHandler = (cartItem: CartItem) => {
    const gameInCart = cart.items.find((item) => item.id === cartItem.id)
    toast({ title: `${data?.title} was added to your cart!` })
    if (gameInCart) {
      dispatch({
        type: CartActionType.UPDATE_ITEM_QUANTITY,
        payload: { id: gameInCart.id, quantity: gameInCart.quantity + 1 },
      })
    } else {
      dispatch({
        type: CartActionType.ADD_ITEM,
        payload: cartItem,
      })
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[75vh] items-center justify-center'>
        <Loader />
      </div>
    )
  }

  if (data && !isLoading) {
    const informationData = [
      { label: 'Genre', value: data.genre },
      { label: 'Platform', value: data.platform },
      { label: 'Publisher', value: data.publisher },
      { label: 'Developer', value: data.developer },
      { label: 'Release date', value: data.release_date },
    ]

    const cartItem = {
      id: data.id,
      quantity: 1,
      thumbnailUrl: data.thumbnail,
      title: data.title,
      price: data.price,
      platform: data.platform,
      discount: data.discount,
    }

    return (
      <div className='flex min-h-[75vh] flex-col gap-16 px-40 py-12'>
        <div className='flex justify-between gap-12'>
          <div>
            <Image alt={data.title as string} width={500} height={300} src={data.thumbnail as string} />
          </div>
          <div className='flex w-[50vw] flex-col justify-between text-foreground'>
            <div>
              <h1 className='text-[2rem] font-bold'>{data.title}</h1>

              <p className='m-0 text-2xl'>{data.short_description}</p>
            </div>
            <div className='flex flex-col'>
              <div className='mb-4 mt-8 flex items-end justify-center gap-[0.6rem]'>
                <span className='text-xl line-through'>{data.price}€</span>
                <span className='text-xl text-[#fc6d42]'>-{data.discount}%</span>
                <span className='text-5xl leading-[1.1]'>{calculateDiscountedPrice(data.price, data.discount)}€</span>
              </div>
              <div className='flex gap-4'>
                <button className={buttonStyles}>
                  <Image width={24} height={24} alt='favorite' src='/icons/favorite.svg' />
                </button>
                <button className={cn(buttonStyles, 'w-full justify-center')} onClick={() => addGameHandler(cartItem)}>
                  <Image width={24} height={24} alt='shopping-cart' src='/icons/shopping-cart.svg' />{' '}
                  <span className='text-base font-bold'>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div>
          {informationData.map((item) => (
            <div key={item.label} className='flex'>
              <div className='mr-4 w-24'>
                <span className='text-base text-[#888]'>{item.label}: </span>
              </div>
              <div>
                <span className='text-base text-foreground'>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}
