import Image from 'next/image'

import { OrderItemObject, OrderObject } from '../../integration/repository'

interface ShippingRowProps {
  item: OrderItemObject
  order: OrderObject
}

// A physical edition has nothing to redeem on Steam, so it gets no code, no
// copy button, and no "Mark as activated" button - just the edition name and
// where it ships, per physical-editions-spec.md Feature 6.
export const ShippingRow = ({ item, order }: ShippingRowProps) => {
  return (
    <div data-testid='shipping-row' className='flex items-center gap-4 border border-border bg-card p-4'>
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
        <span className='truncate font-display text-[15px] font-medium text-foreground'>
          {item.game?.title} — {item.edition?.name}
        </span>
        <span data-testid='shipping-note' className='font-sans text-xs text-muted-foreground'>
          Ships to {order.shippingName}, {order.shippingCity}
        </span>
      </div>
    </div>
  )
}
