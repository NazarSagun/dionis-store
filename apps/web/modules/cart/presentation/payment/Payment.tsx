'use client'

import { useEffect, useRef, useState } from 'react'
import { Input, Label, Skeleton } from '@repo/ui'

import { useCartItems } from '../../core/facade'
import { calculateCartSummary } from '../../domain/pricing'
import { useCreatePaymentIntent } from '../../integration/repository'

import { PaymentForm, ShippingAddress } from './PaymentForm'
import { Elements, loadStripe } from './stripe-elements'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)

// Mirrors apps/api/src/features/orders/shipping-fee.ts's SHIPPING_FEE_CENTS.
// Only used for the summary line shown here - Stripe is always charged the
// server-computed amount, per checkout-payment-activation-spec.md Feature 1.
const SHIPPING_FEE_EUR = 5

const EMPTY_ADDRESS: ShippingAddress = {
  shippingName: '',
  shippingLine1: '',
  shippingLine2: '',
  shippingCity: '',
  shippingPostalCode: '',
  shippingCountry: '',
}

export const Payment = () => {
  const items = useCartItems()
  const { mutateAsync: createPaymentIntent } = useCreatePaymentIntent()
  const [clientSecret, setClientSecret] = useState<string>()
  const [error, setError] = useState<string>()
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_ADDRESS)
  const hasRequestedIntent = useRef(false)

  const hasPhysicalItem = items.some((item) => item.editionId !== null)

  const requestClientSecret = async () => {
    setError(undefined)
    try {
      const result = await createPaymentIntent({
        data: {
          items: items.map((item) => ({ gameId: item.id, quantity: item.quantity, editionId: item.editionId })),
        },
      })
      setClientSecret(result.clientSecret as string)
    } catch {
      setError('Could not start payment. Please try again.')
    }
  }

  useEffect(() => {
    // Stripe Elements does not support swapping its clientSecret after
    // mounting, so this must run at most once, even under React Strict
    // Mode's dev-only double-invocation of effects. The address form below
    // does not gate this request: physical-editions-spec.md Feature 3 checks
    // the address at submit time instead, since the intent already exists
    // by the time any address field is filled in.
    if (items.length === 0 || hasRequestedIntent.current) return
    hasRequestedIntent.current = true
    requestClientSecret()
    // Only re-run if the cart's item count changes, not on every render.
  }, [items.length])

  const { initialPrice, totalDiscount, finalPrice } = calculateCartSummary(items)
  const shippingFee = hasPhysicalItem ? SHIPPING_FEE_EUR : 0
  const total = finalPrice + shippingFee

  const setAddressField = (field: keyof ShippingAddress) => (value: string) =>
    setShippingAddress((address) => ({ ...address, [field]: value }))

  return (
    <div data-testid='payment' className='flex w-full flex-col items-center gap-10 px-[35px] py-16'>
      <h1 className='font-display text-xl uppercase text-neon-magenta'>Payment</h1>
      <div className='flex w-full max-w-[500px] flex-col gap-8'>
        <div
          data-testid='payment-summary'
          className='rounded-md border-2 border-ink bg-panel-alt p-8 font-mono text-foreground'
        >
          <div className='flex flex-col gap-1 text-muted-foreground'>
            <div className='flex justify-between'>
              <div>Official price</div>
              <div>{initialPrice}€</div>
            </div>
            {totalDiscount > 0 && (
              <div className='flex justify-between'>
                <div>Discount</div>
                <div>{totalDiscount.toFixed(2)}€</div>
              </div>
            )}
            {hasPhysicalItem && (
              <div data-testid='shipping-fee' className='flex justify-between'>
                <div>Shipping</div>
                <div>{shippingFee.toFixed(2)}€</div>
              </div>
            )}
          </div>
          <div className='mb-4 mt-[0.8rem] flex justify-between border-t-2 border-ink pt-4'>
            <div className='text-xl font-bold'>Subtotal</div>
            <div className='font-display text-lg text-neon-amber'>{total.toFixed(2)}€</div>
          </div>
        </div>
        {hasPhysicalItem && (
          <div data-testid='shipping-address-form' className='flex flex-col'>
            <h2 className='mb-2 font-display text-xs uppercase text-neon-cyan'>Shipping address</h2>
            <Label>Full name</Label>
            <Input
              name='shipping-name'
              data-testid='shipping-name'
              value={shippingAddress.shippingName}
              onInputChange={setAddressField('shippingName')}
            />
            <Label>Address line 1</Label>
            <Input
              name='shipping-line1'
              data-testid='shipping-line1'
              value={shippingAddress.shippingLine1}
              onInputChange={setAddressField('shippingLine1')}
            />
            <Label>Address line 2 (optional)</Label>
            <Input
              name='shipping-line2'
              data-testid='shipping-line2'
              value={shippingAddress.shippingLine2}
              onInputChange={setAddressField('shippingLine2')}
            />
            <Label>City</Label>
            <Input
              name='shipping-city'
              data-testid='shipping-city'
              value={shippingAddress.shippingCity}
              onInputChange={setAddressField('shippingCity')}
            />
            <Label>Postal code</Label>
            <Input
              name='shipping-postal-code'
              data-testid='shipping-postal-code'
              value={shippingAddress.shippingPostalCode}
              onInputChange={setAddressField('shippingPostalCode')}
            />
            <Label>Country</Label>
            <Input
              name='shipping-country'
              data-testid='shipping-country'
              value={shippingAddress.shippingCountry}
              onInputChange={setAddressField('shippingCountry')}
            />
          </div>
        )}
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
            <PaymentForm finalPrice={total} hasPhysicalItem={hasPhysicalItem} shippingAddress={shippingAddress} />
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
