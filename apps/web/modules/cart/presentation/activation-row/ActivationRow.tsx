import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'

import {
  getGetOrderQueryKey,
  getGetOrdersQueryKey,
  OrderItemObject,
  useActivateOrderItem,
} from '../../integration/repository'

const REDEEM_URL = 'https://store.steampowered.com/account/registerkey'

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
    <div
      data-testid='activation-row'
      className='flex flex-wrap items-center gap-4 rounded-lg border border-ink bg-panel-alt p-4'
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
        className='rounded border border-ink bg-background px-3 py-2 font-mono text-sm text-muted-foreground'
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
          className='rounded border border-ink bg-neon-green px-3 py-2 font-mono text-sm font-bold text-ink'
        >
          Activated
        </span>
      ) : (
        <button
          type='button'
          data-testid='activation-mark-button'
          onClick={onMarkActivated}
          disabled={isPending}
          className='rounded border border-neon-cyan bg-panel-alt px-3 py-2 font-mono text-sm font-bold text-neon-cyan disabled:opacity-50'
        >
          Mark as activated
        </button>
      )}
    </div>
  )
}
