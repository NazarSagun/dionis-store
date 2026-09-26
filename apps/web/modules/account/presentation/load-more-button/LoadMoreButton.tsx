import { Button } from '@repo/ui'

interface LoadMoreButtonProps {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

export const LoadMoreButton = ({ hasNextPage, isFetchingNextPage, onLoadMore }: LoadMoreButtonProps) => {
  if (!hasNextPage) return null

  return (
    <div className='flex justify-center pt-8'>
      <Button onClick={onLoadMore} disabled={isFetchingNextPage}>
        {isFetchingNextPage ? 'Loading…' : 'Load more'}
      </Button>
    </div>
  )
}
