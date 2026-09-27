'use client'

import { Fragment, useEffect, useState } from 'react'
import { Button, Skeleton } from '@repo/ui'

import { formatCentsToEuros, formatOrderDate } from '@/modules/account/domain/formatting'

import { adminButtonText, adminInput, adminLabel, adminPanel } from '../../domain/styles'
import { AdminOrderObject, useGetAdminOrders } from '../../integration/repository'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
const headerCell = 'px-6 py-3 text-left font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground'

const OrderDetails = ({ order }: { order: AdminOrderObject }) => (
  <tr className='bg-panel-alt'>
    <td colSpan={6} className='px-6 pb-6 pt-2'>
      <div data-testid='admin-order-items' className='flex flex-col gap-8 pl-10 sm:flex-row'>
        <div className='flex flex-1 flex-col gap-3'>
          <span className={adminLabel}>Items</span>
          {(order.items ?? []).map((item) => (
            <div key={item.id} className='flex items-center gap-4'>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='font-sans text-sm font-semibold text-foreground'>{item.game?.title}</span>
                <span className='font-sans text-xs text-muted-foreground'>{item.edition?.name ?? 'Digital'}</span>
              </div>
              <span className='font-mono text-sm text-muted-foreground'>×{item.quantity}</span>
              <span className='font-mono text-sm tabular-nums text-foreground'>
                €{formatCentsToEuros(item.price as number)}
              </span>
              {item.editionId == null && (
                <span
                  className={`rounded-full border px-2.5 py-1 font-sans text-xs ${
                    item.activated ? 'border-success text-success' : 'border-border text-muted-foreground'
                  }`}
                >
                  {item.activated ? 'Activated' : 'Not activated'}
                </span>
              )}
            </div>
          ))}
        </div>
        {order.shippingName && (
          <div className='flex w-full flex-col gap-1.5 sm:w-[300px]'>
            <span className={adminLabel}>Shipping</span>
            {[
              order.shippingName,
              order.shippingLine1,
              order.shippingLine2,
              `${order.shippingPostalCode} ${order.shippingCity}`,
              order.shippingCountry,
            ]
              .filter(Boolean)
              .map((line) => (
                <span key={line} className='font-sans text-sm text-foreground'>
                  {line}
                </span>
              ))}
          </div>
        )}
      </div>
    </td>
  </tr>
)

export const OrdersTable = () => {
  const [page, setPage] = useState(1)
  const [typed, setTyped] = useState('')
  const [email, setEmail] = useState<string>()
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setEmail(typed.trim() || undefined)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [typed])

  const { data, isLoading, isError } = useGetAdminOrders({ page, pageSize: PAGE_SIZE, email })
  const orders = data?.items ?? []
  const total = data?.total ?? 0
  const lastPage = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  return (
    <div className='flex w-full flex-col gap-6'>
      <label className='flex w-full max-w-[360px] flex-col gap-2'>
        <span className={adminLabel}>Search by customer email</span>
        <input
          data-testid='admin-orders-search'
          type='search'
          placeholder='Customer email contains…'
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          className={adminInput}
        />
      </label>

      <div className={`${adminPanel} w-full overflow-x-auto`}>
        <table data-testid='admin-orders-table' className='w-full min-w-[720px] border-collapse'>
          <thead className='bg-panel-alt'>
            <tr>
              <th className={`${headerCell} w-12`}>
                <span className='sr-only'>Expand</span>
              </th>
              <th className={headerCell}>Order</th>
              <th className={headerCell}>Date</th>
              <th className={headerCell}>Customer</th>
              <th className={`${headerCell} text-right`}>Items</th>
              <th className={`${headerCell} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isOpen = expanded === order.id
              return (
                <Fragment key={order.id}>
                  <tr
                    data-testid='admin-order-row'
                    className={`border-t border-border ${isOpen ? 'bg-panel-alt' : ''}`}
                  >
                    <td className='px-6 py-4'>
                      <button
                        type='button'
                        data-testid='admin-order-toggle'
                        aria-expanded={isOpen}
                        aria-label={isOpen ? `Hide order ${order.id}` : `Show order ${order.id}`}
                        onClick={() => setExpanded(isOpen ? null : (order.id as number))}
                        className='font-mono text-sm text-muted-foreground hover:text-foreground'
                      >
                        {isOpen ? '−' : '+'}
                      </button>
                    </td>
                    <td className='px-6 py-4 font-mono text-sm text-foreground'>#{order.id}</td>
                    <td className='px-6 py-4 font-sans text-sm text-muted-foreground'>
                      {formatOrderDate(order.createdAt as string)}
                    </td>
                    <td className='px-6 py-4 font-sans text-sm text-foreground'>{order.user.email}</td>
                    <td className='px-6 py-4 text-right font-mono text-sm tabular-nums text-foreground'>
                      {order.items?.length ?? 0}
                    </td>
                    <td className='px-6 py-4 text-right font-mono text-sm tabular-nums text-foreground'>
                      €{formatCentsToEuros(order.totalPrice as number)}
                    </td>
                  </tr>
                  {isOpen && <OrderDetails order={order} />}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        {isLoading && (
          <div className='flex flex-col gap-2 p-4'>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className='h-10 w-full' />
            ))}
          </div>
        )}
        {!isLoading && !isError && orders.length === 0 && (
          <p className='p-6 font-sans text-sm text-muted-foreground'>No orders match this search.</p>
        )}
        {isError && (
          <p className='p-6 font-sans text-sm text-muted-foreground'>Could not load orders. Please try again.</p>
        )}
      </div>

      <div className='flex items-center justify-between gap-4'>
        <span className='font-sans text-sm text-muted-foreground'>
          {total} {total === 1 ? 'order' : 'orders'} · newest first · page {page} of {lastPage}
        </span>
        <div className='flex gap-2'>
          <Button
            variant='secondary'
            className={adminButtonText}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant='secondary'
            className={adminButtonText}
            disabled={page >= lastPage}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
