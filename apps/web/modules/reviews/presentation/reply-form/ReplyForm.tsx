'use client'

import { FormEvent, useId, useState } from 'react'
import { Button } from '@repo/ui'

import { useSendReply } from '../../core/facade'
import { pageOfNextReply, REPLY_MAX_LENGTH } from '../../domain/models'

interface ReplyFormProps {
  reviewId: number
  gameId: number
  replyCount: number
  // Called with the page that holds the new reply, so the thread can load it.
  onSent: (page: number) => void
}

export const ReplyForm = ({ reviewId, gameId, replyCount, onSent }: ReplyFormProps) => {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const { mutate, isPending } = useSendReply(reviewId, gameId)

  const canSend = body.trim().length > 0 && !isPending

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    setError(null)
    mutate(
      { reviewId, data: { body } },
      {
        onSuccess: () => {
          setBody('')
          onSent(pageOfNextReply(replyCount))
        },
        // The typed text stays, so the user can send it again.
        onError: (err) =>
          setError(err.response?.data.message ?? 'Could not send your reply. Check your connection and try again.'),
      },
    )
  }

  return (
    <form data-testid='reply-form' onSubmit={onSubmit} className='flex flex-col gap-2'>
      <label htmlFor={inputId} className='sr-only'>
        Write a reply
      </label>
      <textarea
        id={inputId}
        data-testid='reply-body-input'
        value={body}
        maxLength={REPLY_MAX_LENGTH}
        rows={3}
        placeholder='Write a reply…'
        onChange={(event) => setBody(event.target.value)}
        className='w-full resize-y rounded-md border border-border bg-panel-alt px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      />
      {error && (
        <p data-testid='reply-error' role='alert' className='font-sans text-sm text-destructive'>
          {error}
        </p>
      )}
      <div className='flex items-center justify-between gap-3'>
        <span data-testid='reply-counter' className='font-sans text-xs text-muted-foreground'>
          {body.length} / {REPLY_MAX_LENGTH}
        </span>
        <Button data-testid='reply-submit' type='submit' disabled={!canSend}>
          {isPending ? 'Sending…' : 'Reply'}
        </Button>
      </div>
    </form>
  )
}
