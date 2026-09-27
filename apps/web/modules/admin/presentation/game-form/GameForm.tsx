'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'

import { adminButtonText, adminInput, adminLabel, adminPanel, apiErrorMessage } from '../../domain/styles'
import {
  GameInput,
  GameObject,
  getGetGameQueryKey,
  getGetGamesQueryKey,
  useCreateGame,
  useDeleteGame,
  useUpdateGame,
} from '../../integration/repository'
import { ConfirmDialog } from '../confirm-dialog/ConfirmDialog'

type FieldKey = Exclude<keyof GameInput, 'id'>

// Labels match .claude/specs/app/admin-panel-spec.md Feature 3 and the
// "Admin — Edit game" frame. `wide` fields span both columns.
const FIELDS: { key: FieldKey; label: string; wide?: boolean; multiline?: boolean; numeric?: boolean }[] = [
  { key: 'title', label: 'Title', wide: true },
  { key: 'short_description', label: 'Short description', wide: true, multiline: true },
  { key: 'genre', label: 'Genre' },
  { key: 'platform', label: 'Platform' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'developer', label: 'Developer' },
  { key: 'release_date', label: 'Release date' },
  { key: 'rating', label: 'Rating' },
  { key: 'price', label: 'List price (€)', numeric: true },
  { key: 'discount', label: 'Discount (%)', numeric: true },
  { key: 'thumbnail', label: 'Thumbnail URL', wide: true },
]

type Values = Record<FieldKey, string>

const toValues = (game?: GameObject): Values =>
  Object.fromEntries(FIELDS.map(({ key }) => [key, game ? String(game[key] ?? '') : ''])) as Values

// Numbers go to the API as numbers, and an empty number stays empty, so the
// API's own validation message names the field.
const toPayload = (values: Values) =>
  Object.fromEntries(
    FIELDS.map(({ key, numeric }) => [
      key,
      numeric ? (values[key].trim() === '' ? undefined : Number(values[key])) : values[key],
    ]),
  ) as unknown as GameInput

interface GameFormProps {
  game?: GameObject
}

export const GameForm = ({ game }: GameFormProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [values, setValues] = useState<Values>(() => toValues(game))
  const [formError, setFormError] = useState<string>()
  const [pageError, setPageError] = useState<string>()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { mutate: createGame, isPending: isCreating } = useCreateGame()
  const { mutate: updateGame, isPending: isUpdating } = useUpdateGame()
  const { mutate: deleteGame, isPending: isDeleting } = useDeleteGame()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(undefined)
    const data = toPayload(values)
    const onError = (error: unknown) => setFormError(apiErrorMessage(error))

    if (!game) {
      createGame(
        { data },
        {
          onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: getGetGamesQueryKey(1) })
            toast({ title: 'Game created' })
            router.push(`/admin/games/${created.id}`)
          },
          onError,
        },
      )
      return
    }

    updateGame(
      { id: game.id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetGameQueryKey(game.id) })
          toast({ title: 'Game saved' })
        },
        onError,
      },
    )
  }

  const onConfirmDelete = () => {
    if (!game) return
    deleteGame(
      { id: game.id },
      {
        onSuccess: () => {
          toast({ title: 'Game deleted' })
          router.push('/admin/games')
        },
        onError: (error) => {
          setIsConfirmOpen(false)
          setPageError(apiErrorMessage(error))
        },
      },
    )
  }

  return (
    <div className='flex w-full max-w-[1100px] flex-col gap-6'>
      {pageError && (
        <p role='alert' className='rounded-md border border-primary px-4 py-3 font-sans text-sm text-foreground'>
          {pageError}
        </p>
      )}

      <form
        data-testid='admin-game-form'
        onSubmit={onSubmit}
        noValidate
        className={`${adminPanel} flex flex-col gap-5 p-8`}
      >
        <div className='flex items-center justify-between'>
          <h2 className='font-display text-lg font-medium text-foreground'>{game ? game.title : 'New game'}</h2>
          {game && <span className={adminLabel}>Game #{game.id}</span>}
        </div>

        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
          {FIELDS.map(({ key, label, wide, multiline, numeric }) => {
            const id = `admin-game-${key}`
            const common = {
              id,
              name: key,
              value: values[key],
              onChange: (event: { target: { value: string } }) =>
                setValues((current) => ({ ...current, [key]: event.target.value })),
            }
            return (
              <div key={key} className={`flex flex-col gap-2 ${wide ? 'sm:col-span-2' : ''}`}>
                <label htmlFor={id} className='font-sans text-xs font-semibold text-muted-foreground'>
                  {label}
                </label>
                {multiline ? (
                  <textarea {...common} rows={3} className={`${adminInput} h-auto py-2`} />
                ) : (
                  <input {...common} inputMode={numeric ? 'numeric' : undefined} className={adminInput} />
                )}
              </div>
            )
          })}
        </div>

        {formError && (
          <p
            data-testid='admin-form-error'
            role='alert'
            className='rounded-md border border-primary px-4 py-3 font-sans text-sm text-foreground'
          >
            {formError}
          </p>
        )}

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex gap-3'>
            <Button
              data-testid='admin-game-save'
              type='submit'
              className={adminButtonText}
              disabled={isCreating || isUpdating}
            >
              {game ? 'Save changes' : 'Create game'}
            </Button>
            <Button
              type='button'
              variant='secondary'
              className={adminButtonText}
              onClick={() => router.push('/admin/games')}
            >
              Cancel
            </Button>
          </div>
          {game && (
            <button
              type='button'
              data-testid='admin-game-delete'
              onClick={() => setIsConfirmOpen(true)}
              className='rounded-md border border-primary px-5 py-2.5 font-sans text-sm font-semibold text-primary hover:bg-primary/10'
            >
              Delete game
            </button>
          )}
        </div>
      </form>

      {game && (
        <ConfirmDialog
          open={isConfirmOpen}
          title={`Delete ${game.title}?`}
          description='This removes the game, its editions, and every wishlist entry for it. You cannot undo this.'
          confirmLabel='Delete game'
          isPending={isDeleting}
          onConfirm={onConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />
      )}
    </div>
  )
}
