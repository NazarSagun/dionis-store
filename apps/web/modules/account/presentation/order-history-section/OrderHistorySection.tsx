'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button, Skeleton } from '@repo/ui'

import { formatCentsToEuros, formatOrderDate } from '../../domain/formatting'
import { OrderObject, useOrderPages } from '../../integration/repository'
import { LoadMoreButton } from '../load-more-button/LoadMoreButton'

const OrderHistoryRow = ({ order }: { order: OrderObject }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = order.items ?? []

  return (
    <div data-testid='order-history-row' className='flex flex-col gap-3 border-b border-ink pb-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <button
          type='button'
          data-testid='order-history-toggle'
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className='min-w-0 text-left font-mono text-sm font-bold text-foreground'
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
  const { orders, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useOrderPages()
  const { push } = useRouter()

  return (
    <div data-testid='account-order-history' className='w-full'>
      <h2 className='sr-only'>Order History</h2>
      <div className='w-full'>
        {isLoading && (
          <div className='flex flex-col gap-4'>
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className='h-12 w-full' />
            ))}
          </div>
        )}

        {isError && (
          <p className='text-left font-mono text-muted-foreground'>
            Something went wrong loading your orders. Please try again.
          </p>
        )}

        {!isLoading && !isError && orders?.length === 0 && (
          <div
            data-testid='order-history-empty'
            className='flex flex-col items-center justify-center gap-4 rounded-md border border-ink bg-panel-alt px-0 py-12 text-foreground'
          >
            <p className='font-mono text-muted-foreground'>You have no orders yet.</p>
            <Button onClick={() => push('/')}>Browse games</Button>
          </div>
        )}

        {!isLoading && !isError && orders && orders.length > 0 && (
          <div className='flex w-full flex-col gap-4'>
            {orders.map((order) => (
              <OrderHistoryRow key={order.id} order={order} />
            ))}
          </div>
        )}

        <LoadMoreButton
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </div>
  )
}
