'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useGetOrders } from '@repo/dionis-api/src/dionis/default/default'
import { OrderObject } from '@repo/dionis-api/src/model'

import { formatCentsToEuros, formatOrderDate } from '../../helpers'

const OrderHistoryRow = ({ order }: { order: OrderObject }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = order.items ?? []

  return (
    <div data-testid='order-history-row' className='flex flex-col gap-3 border-b-2 border-ink pb-4'>
      <div className='flex items-center justify-between'>
        <button
          type='button'
          data-testid='order-history-toggle'
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className='font-mono text-sm font-bold text-foreground'
        >
          Order #{order.id} · {formatOrderDate(order.createdAt as string)} · {items.length}{' '}
          {items.length === 1 ? 'item' : 'items'}
        </button>
        <span className='font-display text-lg text-neon-amber'>€{formatCentsToEuros(order.totalPrice as number)}</span>
      </div>
      {isExpanded && (
        <div className='flex flex-col gap-3 pl-4'>
          {items.map((item) => (
            <div key={item.id} className='flex items-center gap-4'>
              <div className='relative size-[48px] shrink-0 overflow-hidden rounded bg-ink'>
                {item.game?.thumbnail && (
                  <Image
                    fill
                    sizes='48px'
                    style={{ objectFit: 'cover' }}
                    alt={`${item.game.title} thumbnail`}
                    src={item.game.thumbnail}
                  />
                )}
              </div>
              <div className='flex flex-col'>
                <span className='font-mono text-sm font-bold text-foreground'>{item.game?.title}</span>
                <span className='font-mono text-xs text-muted-foreground'>{item.game?.platform}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const OrderHistorySection = () => {
  const { data: orders } = useGetOrders()

  return (
    <div data-testid='account-order-history' className='w-full'>
      <h2 className='w-full pt-16 text-center font-display text-xl uppercase text-neon-magenta'>Order History</h2>
      <div className='flex w-full flex-col gap-4 pt-10'>
        {(orders ?? []).map((order) => (
          <OrderHistoryRow key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
