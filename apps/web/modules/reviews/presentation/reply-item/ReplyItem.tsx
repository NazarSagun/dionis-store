import { formatReviewDate } from '../../domain/models'
import { Reply } from '../../integration/repository'

// The body is a React text child, so markup in a reply shows as typed.
export const ReplyItem = ({ reply }: { reply: Reply }) => (
  <article data-testid='reply-item' className='flex flex-col gap-1'>
    <div className='flex flex-wrap items-center gap-2'>
      <span data-testid='reply-author' className='font-sans text-sm font-semibold text-foreground'>
        {reply.authorName}
      </span>
      <time data-testid='reply-date' dateTime={reply.createdAt} className='font-sans text-xs text-muted-foreground'>
        {formatReviewDate(reply.createdAt)}
      </time>
    </div>
    <p data-testid='reply-body' className='whitespace-pre-wrap break-words font-sans text-sm text-foreground'>
      {reply.body}
    </p>
  </article>
)
