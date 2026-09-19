import { FormEvent, useState } from 'react'
import { useConfirmOrder } from '@repo/dionis-api/src/dionis/default/default'
import { useToast } from '@repo/ui'
import type { StripeError } from '@stripe/stripe-js'

import { useCartStore } from '../../store/useCartStore'

import { PaymentElement, useElements, useStripe } from './stripe-elements'

const ctaButtonStyles =
  'w-full rounded-md border-2 border-ink bg-neon-magenta px-[30px] py-[15px] font-display text-xs text-ink shadow-retro transition-transform duration-200 select-none touch-manipulation active:scale-95 disabled:pointer-events-none disabled:opacity-50'

export const PaymentForm = ({ finalPrice }: { finalPrice: number }) => {
  const stripe = useStripe()
  const elements = useElements()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const setStep = useCartStore((state) => state.setStep)
  const setOrderId = useCartStore((state) => state.setOrderId)
  const { mutateAsync: confirmOrder } = useConfirmOrder()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setError(undefined)

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
      const order = await confirmOrder({ data: { paymentIntentId: paymentIntent.id } })
      setOrderId(order.id as number)
      items.forEach((item) => removeItem(item.id))
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
