'use client'

import { FormEvent, useState } from 'react'
import { Button, Skeleton, useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'

import { endOfDayIso, PromoStatus, promoStatus } from '../../domain/promo-status'
import { adminButtonText, adminInput, adminLabel, adminPanel, apiErrorMessage } from '../../domain/styles'
import {
  getGetAdminPromoCodesQueryKey,
  PromoCodeObject,
  useCreateAdminPromoCode,
  useDeleteAdminPromoCode,
  useGetAdminPromoCodes,
} from '../../integration/repository'
import { ConfirmDialog } from '../confirm-dialog/ConfirmDialog'

const headerCell = 'px-6 py-3 text-left font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground'
const cell = 'px-6 py-4 font-sans text-sm text-foreground'
const numberCell = 'px-6 py-4 font-mono text-sm tabular-nums text-foreground'
const statusStyles: Record<PromoStatus, string> = {
  Active: 'text-neon-green',
  Expired: 'text-muted-foreground',
  'Used up': 'text-muted-foreground',
}

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry'

const EMPTY_FORM = { code: '', percentOff: '', expiresAt: '', maxUses: '' }

export const PromoCodesTable = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: codes, isLoading, isError } = useGetAdminPromoCodes()
  const { mutateAsync: createCode, isPending: isCreating } = useCreateAdminPromoCode()
  const { mutateAsync: deleteCode, isPending: isDeleting } = useDeleteAdminPromoCode()
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string>()
  const [toDelete, setToDelete] = useState<PromoCodeObject>()

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetAdminPromoCodesQueryKey() })
  const setField = (key: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(undefined)
    try {
      await createCode({
        data: {
          code: form.code.trim(),
          percentOff: Number(form.percentOff),
          ...(form.expiresAt && { expiresAt: endOfDayIso(form.expiresAt) }),
          ...(form.maxUses && { maxUses: Number(form.maxUses) }),
        },
      })
      setForm(EMPTY_FORM)
      await refresh()
      toast({ title: 'Promo code created' })
    } catch (error) {
      setFormError(apiErrorMessage(error))
    }
  }

  const onConfirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteCode({ id: toDelete.id })
      await refresh()
      toast({ title: 'Promo code deleted' })
    } catch (error) {
      toast({ title: apiErrorMessage(error), variant: 'destructive' })
    }
    setToDelete(undefined)
  }

  return (
    <div className='flex w-full flex-col gap-6'>
      <form data-testid='promo-code-form' onSubmit={onCreate} className='flex flex-wrap items-end gap-4'>
        <label className='flex w-[240px] flex-col gap-2'>
          <span className={adminLabel}>Code</span>
          <input
            data-testid='promo-code-input'
            value={form.code}
            placeholder='e.g. SAVE10'
            onChange={(event) => setField('code')(event.target.value)}
            className={adminInput}
          />
        </label>
        <label className='flex w-[140px] flex-col gap-2'>
          <span className={adminLabel}>Percent off</span>
          <input
            data-testid='promo-percent-input'
            type='number'
            min={1}
            max={100}
            value={form.percentOff}
            placeholder='1–100'
            onChange={(event) => setField('percentOff')(event.target.value)}
            className={adminInput}
          />
        </label>
        <label className='flex w-[200px] flex-col gap-2'>
          <span className={adminLabel}>Expires (optional)</span>
          <input
            data-testid='promo-expires-input'
            type='date'
            value={form.expiresAt}
            onChange={(event) => setField('expiresAt')(event.target.value)}
            className={adminInput}
          />
        </label>
        <label className='flex w-[160px] flex-col gap-2'>
          <span className={adminLabel}>Max uses (optional)</span>
          <input
            data-testid='promo-max-uses-input'
            type='number'
            min={1}
            value={form.maxUses}
            placeholder='Unlimited'
            onChange={(event) => setField('maxUses')(event.target.value)}
            className={adminInput}
          />
        </label>
        <Button data-testid='promo-code-create' type='submit' disabled={isCreating} className={adminButtonText}>
          Create code
        </Button>
        {formError && (
          <p data-testid='promo-form-error' className='w-full font-sans text-sm text-destructive'>
            {formError}
          </p>
        )}
      </form>

      <div className={`${adminPanel} w-full overflow-x-auto`}>
        <table data-testid='promo-codes-table' className='w-full min-w-[760px] border-collapse'>
          <thead className='bg-panel-alt'>
            <tr>
              <th className={headerCell}>Code</th>
              <th className={headerCell}>Discount</th>
              <th className={headerCell}>Expires</th>
              <th className={headerCell}>Uses</th>
              <th className={headerCell}>Status</th>
              <th className={headerCell} />
            </tr>
          </thead>
          <tbody>
            {(codes ?? []).map((promo) => {
              const status = promoStatus(promo)
              return (
                <tr key={promo.id} data-testid='promo-code-row' className='border-t border-border'>
                  <td className='px-6 py-4 font-mono text-sm text-foreground'>{promo.code}</td>
                  <td className={numberCell}>{promo.percentOff}%</td>
                  <td className={cell}>{formatDate(promo.expiresAt)}</td>
                  <td className={numberCell}>
                    {promo.uses} / {promo.maxUses ?? '∞'}
                  </td>
                  <td data-testid='promo-code-status' className={`${cell} ${statusStyles[status]}`}>
                    {status}
                  </td>
                  <td className={`${cell} text-right`}>
                    <button
                      type='button'
                      data-testid='promo-code-delete'
                      onClick={() => setToDelete(promo)}
                      className='font-sans text-sm font-semibold text-destructive hover:underline'
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {isLoading && (
          <div className='flex flex-col gap-2 p-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        )}
        {isError && <p className='p-6 font-sans text-sm text-destructive'>Could not load promo codes.</p>}
        {!isLoading && !isError && codes?.length === 0 && (
          <p className='p-6 font-sans text-sm text-muted-foreground'>No promo codes yet.</p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title='Delete promo code?'
        description={`${toDelete?.code ?? ''} stops working at once. Orders that used it keep it.`}
        confirmLabel='Delete code'
        isPending={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setToDelete(undefined)}
      />
    </div>
  )
}
