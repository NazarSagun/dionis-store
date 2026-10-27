import { useState } from 'react'
import { Input } from '@repo/ui'

import { useApplyPromoCode, useRemovePromoCode } from '../../integration/repository'

export interface AppliedPromo {
  code: string
  discountCents: number
  amountCents: number
}

interface PromoCodeFieldProps {
  paymentIntentId: string
  applied: AppliedPromo | null
  onApplied: (promo: AppliedPromo) => void
  onRemoved: () => void
}

const smallButtonStyles =
  'h-10 shrink-0 rounded-md border border-ink bg-panel-alt px-4 font-sans text-sm font-semibold text-foreground disabled:pointer-events-none disabled:opacity-50'

// The API's own message says why a code was refused, so it is shown as it comes.
function apiMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof message === 'string' && message ? message : fallback
}

export const PromoCodeField = ({ paymentIntentId, applied, onApplied, onRemoved }: PromoCodeFieldProps) => {
  const { mutateAsync: applyCode, isPending: isApplying } = useApplyPromoCode()
  const { mutateAsync: removeCode, isPending: isRemoving } = useRemovePromoCode()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()

  const apply = async () => {
    if (!code.trim()) return
    setError(undefined)
    try {
      const result = await applyCode({ paymentIntentId, data: { code: code.trim() } })
      onApplied({ code: result.code, discountCents: result.discountCents, amountCents: result.amount })
    } catch (applyError) {
      setError(apiMessage(applyError, 'Could not apply that code. Please try again.'))
    }
  }

  const remove = async () => {
    setError(undefined)
    try {
      await removeCode({ paymentIntentId })
      setCode('')
      onRemoved()
    } catch (removeError) {
      setError(apiMessage(removeError, 'Could not remove the code. Please try again.'))
    }
  }

  return (
    <div data-testid='promo-code-field' className='mt-4 flex flex-col gap-2 font-mono'>
      {applied ? (
        <div data-testid='promo-code-applied' className='flex items-center justify-between gap-4 text-sm'>
          <span className='text-neon-green'>{applied.code} applied</span>
          <button
            type='button'
            data-testid='promo-code-remove'
            onClick={remove}
            disabled={isRemoving}
            className='text-muted-foreground underline disabled:opacity-50'
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <label htmlFor='promo-code' className='text-xs uppercase text-muted-foreground'>
            Promo code
          </label>
          <div className='flex items-center gap-2'>
            <Input
              id='promo-code'
              name='promo-code'
              data-testid='promo-code-input'
              value={code}
              onInputChange={setCode}
              placeholder='Enter code'
              // The shared Input adds vertical margins for stacked forms. Here it sits in a row with the button.
              className='m-0 h-10 flex-1 px-3'
            />
            <button
              type='button'
              data-testid='promo-code-apply'
              onClick={apply}
              disabled={isApplying || !code.trim()}
              className={smallButtonStyles}
            >
              {isApplying ? 'Applying…' : 'Apply'}
            </button>
          </div>
        </>
      )}
      {error && (
        <p data-testid='promo-code-error' className='text-xs text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
