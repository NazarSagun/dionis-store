'use client'

import { useEffect, useRef, useState } from 'react'
import { useCreatePaymentIntent } from '@repo/dionis-api/src/dionis/default/default'
import { Skeleton } from '@repo/ui'

import { useCartStore } from '../../store/useCartStore'
import { calculateCartSummary } from '../summary/helpers'

import { PaymentForm } from './PaymentForm'
import { Elements, loadStripe } from './stripe-elements'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)

export const Payment = () => {
  const items = useCartStore((state) => state.items)
  const { mutateAsync: createPaymentIntent } = useCreatePaymentIntent()
  const [clientSecret, setClientSecret] = useState<string>()
  const [error, setError] = useState<string>()
  const hasRequestedIntent = useRef(false)

  const requestClientSecret = async () => {
    setError(undefined)
    try {
      const result = await createPaymentIntent({
        data: { items: items.map((item) => ({ gameId: item.id, quantity: item.quantity })) },
      })
      setClientSecret(result.clientSecret as string)
    } catch {
      setError('Could not start payment. Please try again.')
    }
  }

  useEffect(() => {
    // Stripe Elements does not support swapping its clientSecret after
    // mounting, so this must run at most once, even under React Strict
    // Mode's dev-only double-invocation of effects.
    if (items.length === 0 || hasRequestedIntent.current) return
    hasRequestedIntent.current = true
    requestClientSecret()
    // Only re-run if the cart's item count changes, not on every render.
  }, [items.length])

  const { initialPrice, totalDiscount, finalPrice } = calculateCartSummary(items)

  return (
    <div data-testid='payment' className='flex w-full flex-col items-center gap-10 px-[35px] py-16'>
      <h1 className='font-display text-xl uppercase text-neon-magenta'>Payment</h1>
      <div className='flex w-full max-w-[500px] flex-col gap-8'>
        <div
          data-testid='payment-summary'
          className='rounded-md border-2 border-ink bg-panel-alt p-8 font-mono text-foreground'
        >
          <div className='flex justify-between text-muted-foreground'>
            <div>
              <div>Official price</div>
              <div>Discount</div>
            </div>
            <div>
              <div>{initialPrice}€</div>
              <div>{totalDiscount.toFixed(2)}€</div>
            </div>
          </div>
          <div className='mb-4 mt-[0.8rem] flex justify-between border-t-2 border-ink pt-4'>
            <div className='text-xl font-bold'>Subtotal</div>
            <div className='font-display text-lg text-neon-amber'>{finalPrice.toFixed(2)}€</div>
          </div>
        </div>
        {error ? (
          <div data-testid='payment-intent-error' className='flex flex-col items-center gap-4'>
            <p className='font-mono text-sm text-destructive'>{error}</p>
            <button
              type='button'
              onClick={requestClientSecret}
              className='rounded-md border-2 border-ink bg-neon-magenta px-[30px] py-[15px] font-display text-xs text-ink shadow-retro'
            >
              Retry
            </button>
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm finalPrice={finalPrice} />
          </Elements>
        ) : (
          <div data-testid='payment-skeleton' className='flex w-full flex-col gap-6'>
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-[52px] w-full' />
          </div>
        )}
      </div>
    </div>
  )
}
