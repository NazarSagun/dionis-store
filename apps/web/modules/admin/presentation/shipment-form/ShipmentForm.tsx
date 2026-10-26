'use client'

import { useState } from 'react'
import { Button, useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'

import { ORDER_STATUS_LABELS, OrderStatus } from '@/modules/account/domain/formatting'

import { adminButtonText, adminInput, adminLabel, apiErrorMessage } from '../../domain/styles'
import { AdminOrderObject, getGetAdminOrdersQueryKey, usePatchAdminOrder } from '../../integration/repository'

const TRACKING_NUMBER_MAX_LENGTH = 64

export const ShipmentForm = ({ order }: { order: AdminOrderObject }) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [status, setStatus] = useState<OrderStatus>(order.status ?? 'PENDING')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '')
  const [error, setError] = useState<string>()
  const { mutate: patchOrder, isPending } = usePatchAdminOrder()

  const onSave = () => {
    setError(undefined)
    patchOrder(
      { orderId: order.id as number, data: { status, trackingNumber } },
      {
        onSuccess: () => {
          toast({ title: 'Shipment saved' })
          void queryClient.invalidateQueries({ queryKey: getGetAdminOrdersQueryKey() })
        },
        onError: (saveError) => setError(apiErrorMessage(saveError, 'Could not save the shipment. Please try again.')),
      },
    )
  }

  return (
    <div data-testid='admin-order-shipment' className='flex w-full flex-col gap-3 sm:w-[300px]'>
      <span className={adminLabel}>Shipment</span>
      <label className='flex flex-col gap-2'>
        <span className='font-sans text-[13px] font-semibold text-muted-foreground'>Status</span>
        <select
          data-testid='admin-order-status-select'
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className={adminInput}
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className='flex flex-col gap-2'>
        <span className='font-sans text-[13px] font-semibold text-muted-foreground'>Tracking number (optional)</span>
        <input
          data-testid='admin-order-tracking-input'
          type='text'
          maxLength={TRACKING_NUMBER_MAX_LENGTH}
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          className={adminInput}
        />
      </label>
      <Button
        data-testid='admin-order-shipment-save'
        className={`${adminButtonText} self-start`}
        disabled={isPending}
        onClick={onSave}
      >
        {isPending ? 'Saving…' : 'Save shipment'}
      </Button>
      {error && (
        <p
          data-testid='admin-order-shipment-error'
          role='alert'
          className='rounded-md border border-primary px-4 py-3 font-sans text-sm text-foreground'
        >
          {error}
        </p>
      )}
    </div>
  )
}
