'use client'

import Link from 'next/link'
import { Skeleton } from '@repo/ui'

import { ActivationRow } from '@/modules/cart/presentation/activation-row/ActivationRow'
import { ShippingRow } from '@/modules/cart/presentation/shipping-row/ShippingRow'

import { formatCentsToEuros, formatOrderDate } from '../../domain/formatting'
import { useOrderPages } from '../../integration/repository'
import { LoadMoreButton } from '../load-more-button/LoadMoreButton'

export const LibrarySection = () => {
  const { orders, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useOrderPages()

  return (
    <div data-testid='account-library' className='w-full'>
      <h2 className='w-full pt-16 text-left font-display text-xl uppercase text-neon-magenta'>My Games</h2>
      <div className='w-full pt-10'>
        {isLoading && (
          <div className='flex flex-col gap-4'>
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className='h-[88px] w-full' />
            ))}
          </div>
        )}

        {isError && (
          <p className='text-center font-mono text-muted-foreground'>
            Something went wrong loading your games. Please try again.
          </p>
        )}

        {!isLoading && !isError && orders?.length === 0 && (
          <div data-testid='account-library-empty' className='flex flex-col items-center gap-4 font-mono'>
            <p className='text-muted-foreground'>You have not bought any games yet.</p>
            <Link href='/' className='font-bold text-neon-cyan underline'>
              Browse games
            </Link>
          </div>
        )}

        {!isLoading && !isError && orders && orders.length > 0 && (
          <div className='flex flex-col gap-8'>
            {orders.map((order) => (
              <div key={order.id} className='flex flex-col gap-3'>
                <span className='font-mono text-sm font-bold text-muted-foreground'>
                  Order #{order.id} · {formatOrderDate(order.createdAt as string)} · €
                  {formatCentsToEuros(order.totalPrice as number)}
                </span>
                <div className='flex flex-col gap-4'>
                  {(order.items ?? []).map((item) =>
                    item.editionId != null ? (
                      <ShippingRow key={item.id} item={item} order={order} />
                    ) : (
                      <ActivationRow key={item.id} orderId={order.id as number} item={item} />
                    ),
                  )}
                </div>
              </div>
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
