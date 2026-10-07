'use client'

import { FormEvent, useState } from 'react'
import { Button, useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'

import { adminButtonText, adminInput, adminLabel, adminPanel, apiErrorMessage } from '../../domain/styles'
import {
  EditionInput,
  GameEditionObject,
  getGetGameQueryKey,
  useCreateEdition,
  useDeleteEdition,
  useUpdateEdition,
} from '../../integration/repository'
import { ConfirmDialog } from '../confirm-dialog/ConfirmDialog'

interface EditionValues {
  name: string
  price: string
  discount: string
  stock: string
  description: string
}

const EMPTY: EditionValues = { name: '', price: '', discount: '0', stock: '0', description: '' }

const toValues = (edition: GameEditionObject): EditionValues => ({
  name: edition.name,
  price: String(edition.price),
  discount: String(edition.discount),
  stock: String(edition.stock),
  description: edition.description,
})

const number = (value: string) => (value.trim() === '' ? undefined : Number(value))

interface EditionFormProps {
  initial: EditionValues
  isPending: boolean
  error?: string
  onSave: (values: EditionValues) => void
  onCancel: () => void
}

const EditionForm = ({ initial, isPending, error, onSave, onCancel }: EditionFormProps) => {
  const [values, setValues] = useState(initial)
  const field = (key: keyof EditionValues, label: string, className = '') => (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={`admin-edition-${key}`} className='font-sans text-xs font-semibold text-muted-foreground'>
        {label}
      </label>
      <input
        id={`admin-edition-${key}`}
        value={values[key]}
        onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
        className={adminInput}
      />
    </div>
  )
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSave(values)
  }

  return (
    <form
      data-testid='admin-edition-form'
      onSubmit={onSubmit}
      noValidate
      className='flex flex-col gap-4 rounded-md bg-panel-alt p-6'
    >
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px_140px_140px]'>
        {field('name', 'Name')}
        {field('price', 'Price (€)')}
        {field('discount', 'Discount (%)')}
        {field('stock', 'Stock')}
      </div>
      {field('description', 'Description')}
      {error && (
        <p role='alert' className='font-sans text-sm text-primary'>
          {error}
        </p>
      )}
      <div className='flex gap-3'>
        <Button data-testid='admin-edition-save' type='submit' className={adminButtonText} disabled={isPending}>
          Save edition
        </Button>
        <Button type='button' variant='secondary' className={adminButtonText} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

interface EditionsSectionProps {
  gameId: number
  editions: GameEditionObject[]
}

export const EditionsSection = ({ gameId, editions }: EditionsSectionProps) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [formError, setFormError] = useState<string>()
  const [deleting, setDeleting] = useState<GameEditionObject | null>(null)
  const [sectionError, setSectionError] = useState<string>()

  const { mutate: createEdition, isPending: isCreating } = useCreateEdition()
  const { mutate: updateEdition, isPending: isUpdating } = useUpdateEdition()
  const { mutate: deleteEdition, isPending: isDeleting } = useDeleteEdition()

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetGameQueryKey(gameId) })
  const close = () => {
    setEditing(null)
    setFormError(undefined)
  }

  const onSave = (values: EditionValues) => {
    setFormError(undefined)
    const data = {
      name: values.name,
      description: values.description,
      price: number(values.price),
      discount: number(values.discount),
      stock: number(values.stock),
    }
    const handlers = {
      onSuccess: async () => {
        await refresh()
        toast({ title: 'Edition saved' })
        close()
      },
      onError: (error: unknown) => setFormError(apiErrorMessage(error)),
    }
    // An empty number goes through as undefined, so the API's message names it.
    if (editing === 'new') createEdition({ id: gameId, data: data as EditionInput }, handlers)
    else if (typeof editing === 'number') updateEdition({ id: editing, data }, handlers)
  }

  const onConfirmDelete = () => {
    if (!deleting) return
    deleteEdition(
      { id: deleting.id },
      {
        onSuccess: () => {
          void refresh().then(() => {
            toast({ title: 'Edition deleted' })
            setDeleting(null)
          })
        },
        onError: (error) => {
          setDeleting(null)
          setSectionError(apiErrorMessage(error))
        },
      },
    )
  }

  return (
    <section data-testid='admin-editions' className={`${adminPanel} flex w-full max-w-[1100px] flex-col gap-4 p-8`}>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <h2 className='font-display text-lg font-medium text-foreground'>Editions</h2>
          <p className='font-sans text-sm text-muted-foreground'>
            Physical copies. The digital copy is always available.
          </p>
        </div>
        <Button
          data-testid='admin-edition-add'
          variant='secondary'
          className={adminButtonText}
          onClick={() => {
            setFormError(undefined)
            setEditing('new')
          }}
        >
          Add edition
        </Button>
      </div>

      {sectionError && (
        <p role='alert' className='rounded-md border border-primary px-4 py-3 font-sans text-sm text-foreground'>
          {sectionError}
        </p>
      )}

      {editions.map((edition) =>
        editing === edition.id ? (
          <EditionForm
            key={edition.id}
            initial={toValues(edition)}
            isPending={isUpdating}
            error={formError}
            onSave={onSave}
            onCancel={close}
          />
        ) : (
          <div
            key={edition.id}
            data-testid='admin-edition-row'
            className='flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center'
          >
            <div className='flex min-w-0 flex-1 flex-col gap-1'>
              <span className='font-sans text-sm font-semibold text-foreground'>{edition.name}</span>
              <span className='font-sans text-sm text-muted-foreground'>{edition.description}</span>
            </div>
            {[
              ['Price', `€${edition.price}`],
              ['Discount', `${edition.discount}%`],
              ['Stock', String(edition.stock)],
            ].map(([label, value]) => (
              <div key={label} className='flex w-[88px] flex-col items-end gap-1'>
                <span className={adminLabel}>{label}</span>
                <span className='font-mono text-sm tabular-nums text-foreground'>{value}</span>
              </div>
            ))}
            <span
              className={`w-[104px] rounded-full border px-2.5 py-1 text-center font-sans text-xs ${
                edition.stock > 0 ? 'border-border text-muted-foreground' : 'border-primary text-primary'
              }`}
            >
              {edition.stock > 0 ? 'In stock' : 'Out of stock'}
            </span>
            <div className='flex gap-1'>
              <button
                type='button'
                data-testid='admin-edition-edit'
                onClick={() => {
                  setFormError(undefined)
                  setEditing(edition.id)
                }}
                className='px-3 py-2 font-sans text-sm font-semibold text-foreground'
              >
                Edit
              </button>
              <button
                type='button'
                data-testid='admin-edition-delete'
                onClick={() => setDeleting(edition)}
                className='px-3 py-2 font-sans text-sm font-semibold text-primary'
              >
                Delete
              </button>
            </div>
          </div>
        ),
      )}

      {editing === 'new' && (
        <EditionForm initial={EMPTY} isPending={isCreating} error={formError} onSave={onSave} onCancel={close} />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'this edition'}?`}
        description='Shoppers will no longer see this edition. You cannot undo this.'
        confirmLabel='Delete edition'
        isPending={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
}
