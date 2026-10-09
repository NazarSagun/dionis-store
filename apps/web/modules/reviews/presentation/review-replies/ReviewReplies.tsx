'use client'

import { ReactNode, useState } from 'react'
import { Button, cn, Skeleton } from '@repo/ui'

import { LoginLink } from '@/modules/auth/presentation/login-link/LoginLink'

import { ReviewAccess, useReviewAccess } from '../../core/facade'
import { formatRepliesToggle } from '../../domain/models'
import { useGetReviewReplies } from '../../integration/repository'
import { ReplyForm } from '../reply-form/ReplyForm'
import { ReplyItem } from '../reply-item/ReplyItem'

interface ReviewRepliesProps {
  reviewId: number
  gameId: number
  replyCount: number
  defaultOpen?: boolean
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width={16}
    height={16}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={1.75}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    className={cn('shrink-0 text-muted-foreground', open && 'rotate-180')}
  >
    <path d='m6 9 6 6 6-6' />
  </svg>
)

const LoadError = ({ onRetry }: { onRetry: () => void }) => (
  <div data-testid='reply-load-error' role='alert' className='flex flex-col items-start gap-3'>
    <p className='font-sans text-sm text-foreground'>Replies could not load. Check your connection and try again.</p>
    <Button data-testid='reply-retry' variant='secondary' onClick={onRetry}>
      Try again
    </Button>
  </div>
)

// A page after the first one. The first page is loaded by the thread itself,
// because the thread needs its page count.
const ExtraPage = ({ reviewId, page }: { reviewId: number; page: number }) => {
  const { data, isLoading, isError, refetch } = useGetReviewReplies(reviewId, { page }, { query: { retry: 1 } })

  if (isLoading) return <Skeleton className='h-12 w-full' />
  if (isError || !data) return <LoadError onRetry={() => void refetch()} />
  return (
    <>
      {data.replies.map((reply) => (
        <ReplyItem key={reply.id} reply={reply} />
      ))}
    </>
  )
}

const ReplyAction = ({ access, children }: { access: ReviewAccess; children: ReactNode }) => {
  if (access === 'owner') return <>{children}</>
  if (access === 'loading') return <Skeleton className='h-24 w-full' />
  if (access === 'guest') {
    return (
      <div data-testid='reply-login-prompt' className='flex flex-col items-start gap-3'>
        <p className='font-sans text-sm font-semibold text-foreground'>Log in to reply</p>
        <LoginLink />
      </div>
    )
  }
  return (
    <p data-testid='reply-owner-required' className='font-sans text-sm font-semibold text-foreground'>
      Buy this game to reply
    </p>
  )
}

const ReplyThread = ({
  id,
  reviewId,
  gameId,
  replyCount,
  access,
}: {
  id: string
  reviewId: number
  gameId: number
  replyCount: number
  access: ReviewAccess
}) => {
  const [pageCount, setPageCount] = useState(1)
  const { data, isLoading, isError, refetch } = useGetReviewReplies(reviewId, { page: 1 }, { query: { retry: 1 } })

  let content: ReactNode
  if (isLoading) {
    content = <Skeleton className='h-12 w-full' />
  } else if (isError || !data) {
    content = <LoadError onRetry={() => void refetch()} />
  } else {
    content = (
      <>
        {data.replies.map((reply) => (
          <ReplyItem key={reply.id} reply={reply} />
        ))}
        {Array.from({ length: pageCount - 1 }, (_, index) => (
          <ExtraPage key={index + 2} reviewId={reviewId} page={index + 2} />
        ))}
        {pageCount < data.totalPages && (
          <Button
            data-testid='review-replies-more'
            variant='secondary'
            className='self-start'
            onClick={() => setPageCount((current) => current + 1)}
          >
            Load more replies
          </Button>
        )}
        {data.replies.length === 0 && access === 'owner' && (
          <p data-testid='reply-empty' className='font-sans text-sm text-muted-foreground'>
            No replies yet. Start the conversation.
          </p>
        )}
        <ReplyAction access={access}>
          <ReplyForm
            reviewId={reviewId}
            gameId={gameId}
            replyCount={replyCount}
            onSent={(page) => setPageCount((current) => Math.min(Math.max(current, page), data.totalPages + 1))}
          />
        </ReplyAction>
      </>
    )
  }

  return (
    <div id={id} data-testid='review-thread' className='flex flex-col gap-4 border-l-2 border-border pl-4'>
      {content}
    </div>
  )
}

// The toggle under a review and the thread it opens. The replies load when the
// thread opens, not before. A review with no reply gets a toggle only for a
// user who can write the first one.
export const ReviewReplies = ({ reviewId, gameId, replyCount, defaultOpen = false }: ReviewRepliesProps) => {
  const access = useReviewAccess(gameId)
  const [open, setOpen] = useState(defaultOpen)
  const threadId = `review-thread-${reviewId}`

  if (replyCount === 0 && access !== 'owner') return null

  return (
    <div className='flex flex-col gap-3'>
      <button
        type='button'
        data-testid='review-replies-toggle'
        aria-expanded={open}
        aria-controls={threadId}
        onClick={() => setOpen((current) => !current)}
        className='flex min-h-11 w-fit items-center gap-2 rounded-md font-sans text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <Chevron open={open} />
        {formatRepliesToggle(replyCount)}
      </button>
      {open && (
        <ReplyThread id={threadId} reviewId={reviewId} gameId={gameId} replyCount={replyCount} access={access} />
      )}
    </div>
  )
}
