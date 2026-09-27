import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'

import {
  getGetOrderQueryKey,
  getGetOrdersQueryKey,
  OrderItemObject,
  useActivateOrderItem,
} from '../../integration/repository'

const REDEEM_URL = 'https://store.steampowered.com/account/registerkey'

// Matches the rows in the Figma "Account — Library" and "Cart: Game Activation" frames.
const rowStyles = 'flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-center'

interface ActivationRowProps {
  orderId: number
  item: OrderItemObject
}

export const ActivationRow = ({ orderId, item }: ActivationRowProps) => {
  const queryClient = useQueryClient()
  const { mutate: activate, isPending } = useActivateOrderItem()

  const onCopy = () => {
    navigator.clipboard.writeText(item.activationCode as string)
  }

  const onMarkActivated = () => {
    activate(
      { orderId, itemId: item.id as number },
      {
        onSuccess: () => {
          // This row renders inside GameActivation.tsx (reads a single order,
          // keyed by orderId) and inside the account Library section (reads
          // every order at once, its own key). Invalidate both: whichever one
          // isn't mounted right now is simply not being watched, so this is a
          // no-op there, not an extra request.
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) })
          queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() })
        },
      },
    )
  }

  return (
    <div data-testid='activation-row' className={rowStyles}>
      <div className='flex min-w-0 flex-1 items-center gap-4'>
        <div className='relative size-11 shrink-0 overflow-hidden rounded bg-panel-alt'>
          {item.game?.thumbnail && (
            <Image
              fill
              sizes='44px'
              style={{ objectFit: 'cover' }}
              alt={`${item.game.title} thumbnail`}
              src={item.game.thumbnail}
            />
          )}
        </div>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <span className='truncate font-display text-[15px] font-medium text-foreground'>{item.game?.title}</span>
          <span className='font-sans text-xs text-muted-foreground'>{item.game?.platform}</span>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        <span
          data-testid='activation-code'
          className='rounded border border-border bg-panel-alt px-2.5 py-1.5 font-mono text-xs text-foreground'
        >
          {item.activationCode}
        </span>
        <button
          type='button'
          data-testid='activation-copy'
          onClick={onCopy}
          className='font-sans text-xs font-semibold text-muted-foreground hover:text-foreground'
        >
          Copy
        </button>
        <a
          href={REDEEM_URL}
          target='_blank'
          rel='noreferrer'
          data-testid='activation-redeem-link'
          className='font-sans text-xs font-semibold text-primary hover:underline'
        >
          Redeem on Steam
        </a>
        {item.activated ? (
          <span
            data-testid='activation-status'
            className='rounded-full border border-success bg-panel-alt px-3 py-1 font-sans text-xs font-semibold text-success'
          >
            Activated
          </span>
        ) : (
          <button
            type='button'
            data-testid='activation-mark-button'
            onClick={onMarkActivated}
            disabled={isPending}
            className='rounded-md border border-border bg-panel-alt px-6 py-3 font-sans text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50'
          >
            Mark as Activated
          </button>
        )}
      </div>
    </div>
  )
}
