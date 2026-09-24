import { FormEvent, useState } from 'react'
import { useToast } from '@repo/ui'
import type { StripeError } from '@stripe/stripe-js'

import { useCartItems, useRemoveCartItem, useSetCartOrderId, useSetCartStep } from '../../core/facade'
import { useConfirmOrder } from '../../integration/repository'

import { PaymentElement, useElements, useStripe } from './stripe-elements'

const ctaButtonStyles =
  'w-full rounded-md border-2 border-ink bg-neon-magenta px-[30px] py-[15px] font-display text-xs text-ink shadow-retro transition-transform duration-200 select-none touch-manipulation active:scale-95 disabled:pointer-events-none disabled:opacity-50'

export interface ShippingAddress {
  shippingName: string
  shippingLine1: string
  shippingLine2: string
  shippingCity: string
  shippingPostalCode: string
  shippingCountry: string
}

const REQUIRED_ADDRESS_FIELDS = [
  'shippingName',
  'shippingLine1',
  'shippingCity',
  'shippingPostalCode',
  'shippingCountry',
] as const

interface PaymentFormProps {
  finalPrice: number
  hasPhysicalItem: boolean
  shippingAddress: ShippingAddress
}

export const PaymentForm = ({ finalPrice, hasPhysicalItem, shippingAddress }: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const items = useCartItems()
  const removeItem = useRemoveCartItem()
  const setStep = useSetCartStep()
  const setOrderId = useSetCartOrderId()
  const { mutateAsync: confirmOrder } = useConfirmOrder()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [addressError, setAddressError] = useState<string>()

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setError(undefined)
    setAddressError(undefined)

    // Checked before Stripe is ever touched: the intent already exists by
    // the time this form renders (Payment.tsx requests it on mount), so a
    // missing address here can't block that request. It can, and must,
    // block the charge - a shopper should never pay for an order the
    // backend will then reject for a missing shipping address.
    if (hasPhysicalItem && REQUIRED_ADDRESS_FIELDS.some((field) => !shippingAddress[field].trim())) {
      setAddressError('Please fill in every required shipping field.')
      return
    }

    setIsSubmitting(true)

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (stripeError || paymentIntent?.status !== 'succeeded') {
      setError((stripeError as StripeError | undefined)?.message ?? 'Payment could not be completed. Please try again.')
      setIsSubmitting(false)
      return
    }

    try {
      const order = await confirmOrder({
        data: {
          paymentIntentId: paymentIntent.id,
          ...(hasPhysicalItem ? { shippingAddress } : {}),
        },
      })
      setOrderId(order.id as number)
      items.forEach((item) => removeItem(item.id, item.editionId))
      toast({ title: 'Payment successful! Your order is confirmed.' })
      setStep(3)
    } catch {
      setError('Payment succeeded, but we could not finish your order. Please contact support.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className='flex w-full flex-col gap-6'>
      <PaymentElement />
      {addressError && (
        <p data-testid='shipping-address-error' className='font-mono text-sm text-destructive'>
          {addressError}
        </p>
      )}
      {error && (
        <p data-testid='payment-error' className='font-mono text-sm text-destructive'>
          {error}
        </p>
      )}
      <button type='submit' disabled={!stripe || isSubmitting} data-testid='payment-submit' className={ctaButtonStyles}>
        {isSubmitting ? 'Processing...' : `Pay €${finalPrice.toFixed(2)}`}
      </button>
    </form>
  )
}
