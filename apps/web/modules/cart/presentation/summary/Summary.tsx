import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, DialogTrigger } from '@repo/ui'

import { useIsAuthenticated } from '@/modules/auth/core/facade'

import { useCartItems, useCloseCartDrawer, useSetCartStep } from '../../core/facade'
import { calculateCartSummary } from '../../domain/pricing'

const ctaButtonStyles =
  'w-full rounded-md border border-ink bg-neon-magenta px-[30px] py-[15px] font-display text-xs text-primary-foreground shadow-retro transition-transform duration-200 select-none touch-manipulation active:scale-95 disabled:pointer-events-none disabled:opacity-50'

export const Summary = () => {
  const items = useCartItems()
  const setStep = useSetCartStep()
  const closeDrawer = useCloseCartDrawer()
  const isAuthenticated = useIsAuthenticated()
  const { push } = useRouter()

  const goToPayment = () => {
    setStep(2)
    closeDrawer()
    push('/cart')
  }

  const [summery, setSummery] = useState({ totalDiscount: 0, finalPrice: 0, initialPrice: 0 })

  useEffect(() => {
    const { totalDiscount, finalPrice, initialPrice } = calculateCartSummary(items)
    setSummery({ totalDiscount, finalPrice, initialPrice })
  }, [items])

  return (
    <div className='rounded-md border border-ink bg-panel-alt p-8 font-mono text-foreground'>
      <div className='flex flex-col gap-1 text-muted-foreground'>
        <div className='flex justify-between'>
          <div>Official price</div>
          <div>{summery.initialPrice}€</div>
        </div>
        {summery.totalDiscount > 0 && (
          <div className='flex justify-between'>
            <div>Discount</div>
            <div>{summery.totalDiscount.toFixed(2)}€</div>
          </div>
        )}
      </div>
      <div className='mb-4 mt-[0.8rem] flex justify-between border-t border-ink pt-4'>
        <div className='text-xl font-bold'>Subtotal</div>
        <div className='font-display text-lg text-neon-amber'>{summery.finalPrice.toFixed(2)}€</div>
      </div>
      <div className='flex flex-col items-center'>
        {isAuthenticated ? (
          <button onClick={goToPayment} disabled={items.length === 0} className={ctaButtonStyles}>
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

        <Button
          variant='link'
          onClick={() => {
            closeDrawer()
            push('/')
          }}
        >
          Continue shopping
        </Button>
      </div>
    </div>
  )
}
