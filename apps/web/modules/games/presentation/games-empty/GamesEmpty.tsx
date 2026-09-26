import { Button } from '@repo/ui'

interface GamesEmptyProps {
  search?: string
  onClearFilters: () => void
}

// Same treatment as the wishlist and Order History empty states.
export const GamesEmpty = ({ search, onClearFilters }: GamesEmptyProps) => (
  <div
    data-testid='games-empty'
    className='flex flex-col items-center justify-center gap-4 rounded-md border border-ink bg-panel-alt px-4 py-12 text-center text-foreground'
  >
    <p className='font-mono text-foreground'>
      {search ? `No games match "${search}".` : 'No games match these filters.'}
    </p>
    <p className='font-mono text-sm text-muted-foreground'>Try a different search, or clear the filters.</p>
    <Button onClick={onClearFilters}>Clear filters</Button>
  </div>
)
