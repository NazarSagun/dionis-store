'use client'

import Image from 'next/image'
import { getGetOrderQueryKey, useActivateOrderItem, useGetOrder } from '@repo/dionis-api/src/dionis/default/default'
import { OrderItemObject } from '@repo/dionis-api/src/model'
import { Skeleton } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'

import { useCartStore } from '../../store/useCartStore'

const REDEEM_URL = 'https://store.steampowered.com/account/registerkey'

const ActivationRow = ({ orderId, item }: { orderId: number; item: OrderItemObject }) => {
  const queryClient = useQueryClient()
  const { mutate: activate, isPending } = useActivateOrderItem()

  const onCopy = () => {
    navigator.clipboard.writeText(item.activationCode as string)
  }

  const onMarkActivated = () => {
    activate(
      { orderId, itemId: item.id as number },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) }) },
    )
  }

  return (
    <div
      data-testid='activation-row'
      className='flex items-center gap-4 rounded-lg border-2 border-ink bg-panel-alt p-4'
    >
      <div className='relative size-[72px] shrink-0 overflow-hidden rounded bg-ink'>
        {item.game?.thumbnail && (
          <Image
            fill
            sizes='72px'
            style={{ objectFit: 'cover' }}
            alt={`${item.game.title} thumbnail`}
            src={item.game.thumbnail}
          />
        )}
      </div>
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <span className='truncate font-mono text-base font-bold text-foreground'>{item.game?.title}</span>
        <span className='font-mono text-xs text-muted-foreground'>{item.game?.platform}</span>
      </div>
      <span
        data-testid='activation-code'
        className='rounded border-2 border-ink bg-background px-3 py-2 font-mono text-sm text-muted-foreground'
      >
        {item.activationCode}
      </span>
      <button
        type='button'
        data-testid='activation-copy'
        onClick={onCopy}
        className='font-mono text-sm font-bold text-neon-cyan underline'
      >
        Copy code
      </button>
      <a
        href={REDEEM_URL}
        target='_blank'
        rel='noreferrer'
        data-testid='activation-redeem-link'
        className='font-mono text-sm font-bold text-neon-cyan underline'
      >
        Redeem on Steam
      </a>
      {item.activated ? (
        <span
          data-testid='activation-status'
          className='rounded border-2 border-ink bg-neon-green px-3 py-2 font-mono text-sm font-bold text-ink'
        >
          Activated
        </span>
      ) : (
        <button
          type='button'
          data-testid='activation-mark-button'
          onClick={onMarkActivated}
          disabled={isPending}
          className='rounded border-2 border-neon-cyan bg-panel-alt px-3 py-2 font-mono text-sm font-bold text-neon-cyan disabled:opacity-50'
        >
          Mark as activated
        </button>
      )}
    </div>
  )
}

export const GameActivation = () => {
  const orderId = useCartStore((state) => state.orderId)
  const setOrderId = useCartStore((state) => state.setOrderId)
  const setStep = useCartStore((state) => state.setStep)

  const { data: order, isLoading } = useGetOrder(orderId as number, { query: { enabled: orderId !== null } })

  if (isLoading || !order) {
    return (
      <div data-testid='game-activation' className='flex w-full flex-col items-center gap-10 px-[35px] py-16'>
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
    <div data-testid='game-activation' className='flex w-full flex-col items-center gap-10 px-[35px] py-16'>
      <h1 className='font-display text-xl uppercase text-neon-magenta'>Game Activation</h1>
      <div className='flex w-full max-w-[900px] flex-col gap-4'>
        {items.map((item) => (
          <ActivationRow key={item.id} orderId={order.id as number} item={item} />
        ))}
      </div>
      <button
        type='button'
        data-testid='finish-button'
        onClick={onFinish}
        className='rounded-md border-2 border-ink bg-neon-magenta px-[30px] py-[15px] font-display text-xs text-ink shadow-retro transition-transform duration-200'
      >
        Finish
      </button>
    </div>
  )
}
