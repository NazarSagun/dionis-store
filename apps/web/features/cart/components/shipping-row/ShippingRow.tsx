import Image from 'next/image'
import { OrderItemObject, OrderObject } from '@repo/dionis-api/src/model'

interface ShippingRowProps {
  item: OrderItemObject
  order: OrderObject
}

// A physical edition has nothing to redeem on Steam, so it gets no code, no
// copy button, and no "Mark as activated" button - just the edition name and
// where it ships, per physical-editions-spec.md Feature 6.
export const ShippingRow = ({ item, order }: ShippingRowProps) => {
  return (
    <div data-testid='shipping-row' className='flex items-center gap-4 rounded-lg border-2 border-ink bg-panel-alt p-4'>
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
        <span className='font-mono text-xs text-muted-foreground'>{item.edition?.name}</span>
      </div>
      <span data-testid='shipping-note' className='font-mono text-sm text-neon-cyan'>
        Ships to {order.shippingName}, {order.shippingCity}
      </span>
    </div>
  )
}
