'use client'

import Image from 'next/image'
import { useGetGame } from '@repo/dionis-api/src/dionis/default/default'
import { Loader, useToast } from '@repo/ui'

import { CartItem, useCartStore } from '@/features/cart/store/useCartStore'
import { cn } from '@/lib/utils'

import { calculateDiscountedPrice } from '../../helpers'

const buttonStyles =
  'flex items-center gap-2 rounded-md border-2 border-ink bg-neon-magenta px-[30px] py-[15px] text-ink shadow-retro transition-transform duration-200 select-none touch-manipulation active:scale-95'

interface GameDetailsProps {
  gameId: number
}

export const GameDetails = ({ gameId }: GameDetailsProps) => {
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity)

  const { toast } = useToast()

  const { data, isLoading } = useGetGame(gameId)

  const addGameHandler = (cartItem: CartItem) => {
    const gameInCart = items.find((item) => item.id === cartItem.id)
    toast({ title: `${data?.title} was added to your cart!` })
    if (gameInCart) {
      updateItemQuantity(gameInCart.id, gameInCart.quantity + 1)
    } else {
      addItem(cartItem)
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

    const cartItem = buildCartItem(data)

    return (
      <div className='flex min-h-[75vh] flex-col gap-16 px-40 py-12'>
        <div className='flex justify-between gap-12'>
          <div>
            <Image alt={data.title as string} width={500} height={300} src={data.thumbnail as string} />
          </div>
          <div className='flex w-[50vw] flex-col justify-between text-foreground'>
            <div>
              <h1 className='font-display text-2xl'>{data.title}</h1>

              <p className='m-0 mt-4 font-mono text-lg text-muted-foreground'>{data.short_description}</p>
            </div>
            <div className='flex flex-col'>
              <div className='mb-4 mt-8 flex items-end justify-center gap-[0.6rem]'>
                {data.discount > 0 && (
                  <>
                    <span className='font-mono text-xl text-muted-foreground line-through'>{data.price}€</span>
                    <span className='font-mono text-xl text-neon-amber'>-{data.discount}%</span>
                  </>
                )}
                <span className='font-display text-3xl leading-[1.4] text-neon-magenta'>
                  {data.discount > 0 ? calculateDiscountedPrice(data.price, data.discount) : data.price}€
                </span>
              </div>
              <div className='flex gap-4'>
                <button className={buttonStyles}>
                  <Image width={24} height={24} alt='favorite' src='/icons/favorite.svg' />
                </button>
                <button className={cn(buttonStyles, 'w-full justify-center')} onClick={() => addGameHandler(cartItem)}>
                  <Image width={24} height={24} alt='shopping-cart' src='/icons/shopping-cart.svg' />{' '}
                  <span className='font-display text-xs'>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className='rounded-md border-2 border-ink bg-panel-alt px-8 py-6'>
          {informationData.map((item) => (
            <div key={item.label} className='flex py-1'>
              <div className='mr-4 w-32'>
                <span className='font-mono text-base text-neon-cyan'>{item.label}: </span>
              </div>
              <div>
                <span className='font-mono text-base text-foreground'>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

function buildCartItem(data: {
  id: number
  thumbnail: string
  title: string
  price: number
  platform: string
  discount: number
}) {
  return {
    id: data.id,
    quantity: 1,
    thumbnailUrl: data.thumbnail,
    title: data.title,
    price: data.price,
    platform: data.platform,
    discount: data.discount,
  }
}
