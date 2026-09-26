'use client'

import { Skeleton } from '@repo/ui'

import { useCartOrderId, useSetCartOrderId, useSetCartStep } from '../../core/facade'
import { useGetOrder } from '../../integration/repository'
import { ActivationRow } from '../activation-row/ActivationRow'
import { ShippingRow } from '../shipping-row/ShippingRow'

export const GameActivation = () => {
  const orderId = useCartOrderId()
  const setOrderId = useSetCartOrderId()
  const setStep = useSetCartStep()

  const { data: order, isLoading } = useGetOrder(orderId as number, { query: { enabled: orderId !== null } })

  if (isLoading || !order) {
    return (
      <div
        data-testid='game-activation'
        className='flex w-full flex-col items-center gap-10 px-4 py-16 sm:px-8 lg:px-[35px]'
      >
        <Skeleton className='h-8 w-64' />
        <div className='flex w-full max-w-[900px] flex-col gap-4'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-[88px] w-full' />
          ))}
        </div>
      </div>
    )
  }

  const items = order.items ?? []

  const onFinish = () => {
    setOrderId(null)
    setStep(1)
    // A full navigation, not client-side routing: this is the end of checkout,
    // and a fresh load of the home page is what we want here.
    window.location.href = '/'
  }

  return (
    <div
      data-testid='game-activation'
      className='flex w-full flex-col items-center gap-10 px-4 py-16 sm:px-8 lg:px-[35px]'
    >
      <h1 className='font-display text-xl uppercase text-neon-magenta'>Game Activation</h1>
      <div className='flex w-full max-w-[900px] flex-col gap-px'>
        {items.map((item) =>
          item.editionId != null ? (
            <ShippingRow key={item.id} item={item} order={order} />
          ) : (
            <ActivationRow key={item.id} orderId={order.id as number} item={item} />
          ),
        )}
      </div>
      <button
        type='button'
        data-testid='finish-button'
        onClick={onFinish}
        className='rounded-md border border-ink bg-neon-magenta px-[30px] py-[15px] font-display text-xs text-primary-foreground shadow-retro transition-transform duration-200'
      >
        Finish
      </button>
    </div>
  )
}
