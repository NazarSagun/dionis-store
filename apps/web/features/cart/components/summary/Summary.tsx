import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, DialogTrigger } from '@repo/ui'

import { useAuthStore } from '@/features/auth'

import { useCartStore } from '../../store/useCartStore'

import { calculateCartSummary } from './helpers'

const ctaButtonStyles =
  'w-full rounded-[10px] border-0 bg-[linear-gradient(45deg,#ff512f_0%,#f09819_51%,#ff512f_100%)] bg-[length:200%_auto] px-[30px] py-[15px] font-bold text-white shadow-[0px_0px_14px_-7px_#f09819] transition-[background-position] duration-500 select-none touch-manipulation hover:bg-right active:scale-95 disabled:pointer-events-none disabled:opacity-50'

export const Summary = () => {
  const items = useCartStore((state) => state.items)
  const setStep = useCartStore((state) => state.setStep)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { push } = useRouter()

  const [summery, setSummery] = useState({ totalDiscount: 0, finalPrice: 0, initialPrice: 0 })

  useEffect(() => {
    const { totalDiscount, finalPrice, initialPrice } = calculateCartSummary(items)
    setSummery({ totalDiscount, finalPrice, initialPrice })
  }, [items])

  return (
    <div className='rounded-[15px] bg-[#0000008d] p-8 text-foreground'>
      <div className='flex justify-between text-[#b5b5b5d0]'>
        <div>
          <div>Official price</div>
          <div>Discount</div>
        </div>
        <div>
          <div>{summery.initialPrice}€</div>
          <div>{summery.totalDiscount}€</div>
        </div>
      </div>
      <div className='mb-4 mt-[0.8rem] flex justify-between'>
        <div className='text-xl font-semibold'>Subtotal</div>
        <div className='text-xl font-semibold'>{summery.finalPrice.toFixed(2)}€</div>
      </div>
      <div className='flex flex-col items-center'>
        {isAuthenticated ? (
          <button onClick={() => setStep(2)} disabled={items.length === 0} className={ctaButtonStyles}>
            Go to payment
          </button>
        ) : (
          <DialogTrigger asChild>
            <button disabled={items.length === 0} className={ctaButtonStyles}>
              Go to payment
            </button>
          </DialogTrigger>
        )}

        <div className="relative mb-2 mt-4 w-full text-center before:absolute before:left-0 before:top-1/2 before:h-px before:w-[43%] before:-translate-y-1/2 before:bg-[#a3a3a3a8] before:content-[''] after:absolute after:right-0 after:top-1/2 after:h-px after:w-[43%] after:-translate-y-1/2 after:bg-[#a3a3a3a8] after:content-['']">
          or
        </div>

        <Button variant='link' onClick={() => push('/')}>
          Continue shopping
        </Button>
      </div>
    </div>
  )
}
