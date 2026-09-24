'use client'

import Link from 'next/link'
import { Skeleton } from '@repo/ui'

import { ActivationRow } from '@/modules/cart/presentation/activation-row/ActivationRow'

import { formatCentsToEuros, formatOrderDate } from '../../domain/formatting'
import { useGetOrders } from '../../integration/repository'

export const LibrarySection = () => {
  const { data: orders, isLoading, isError } = useGetOrders()

  return (
    <div data-testid='account-library' className='w-full'>
      <h2 className='w-full pt-16 text-center font-display text-xl uppercase text-neon-magenta'>My Games</h2>
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
                  {(order.items ?? []).map((item) => (
                    <ActivationRow key={item.id} orderId={order.id as number} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
