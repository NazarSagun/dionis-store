import { useEffect, useRef, useState } from 'react'
import { GetGamesPlatform, GetGamesSort } from '@repo/dionis-api/src/model'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
} from '@repo/ui'
import { Check, ChevronDown } from 'lucide-react'

interface GamesToolbarProps {
  platform?: GetGamesPlatform
  sort?: GetGamesSort
  onSearchChange: (search: string) => void
  onPlatformChange: (platform?: GetGamesPlatform) => void
  onSortChange: (sort?: GetGamesSort) => void
  onClearFilters: () => void
}

const PLATFORM_OPTIONS = Object.values(GetGamesPlatform)

const SORT_OPTIONS: { value: GetGamesSort; label: string }[] = [
  { value: GetGamesSort.price_asc, label: 'Price (low to high)' },
  { value: GetGamesSort.price_desc, label: 'Price (high to low)' },
  { value: GetGamesSort.rating_desc, label: 'Rating (high to low)' },
]

const SEARCH_DEBOUNCE_MS = 300
const ALL_VALUE = 'all'

const triggerStyles =
  'flex h-10 items-center gap-2 rounded-md border border-ink bg-secondary px-4 font-mono text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'

const menuItemStyles =
  'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 font-mono text-sm text-foreground outline-none focus:bg-neon-cyan focus:text-primary-foreground data-[state=checked]:font-bold'

export const GamesToolbar = ({
  platform,
  sort,
  onSearchChange,
  onPlatformChange,
  onSortChange,
  onClearFilters,
}: GamesToolbarProps) => {
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()
  const [searchResetKey, setSearchResetKey] = useState(0)

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const handleSearchInput = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => onSearchChange(value), SEARCH_DEBOUNCE_MS)
  }

  const handleClearFilters = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSearchResetKey((key) => key + 1)
    onClearFilters()
  }

  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label

  return (
    <div data-testid='games-toolbar' className='flex w-full flex-wrap items-center gap-3 pt-8'>
      <Input
        key={searchResetKey}
        name='search'
        type='text'
        placeholder='Search by title...'
        data-testid='search-input'
        onInputChange={handleSearchInput}
        className='mb-0 mt-0 w-72 bg-secondary'
      />
      <div className='flex items-center gap-3'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' data-testid='platform-filter' className={triggerStyles}>
              Platform: {platform ?? 'All'}
              <ChevronDown className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='center' className='border-ink bg-panel-alt'>
            <DropdownMenuRadioGroup
              value={platform ?? ALL_VALUE}
              onValueChange={(value) => onPlatformChange(value === ALL_VALUE ? undefined : (value as GetGamesPlatform))}
            >
              <DropdownMenuRadioItem value={ALL_VALUE} data-testid='platform-option-all' className={menuItemStyles}>
                {platform === undefined && <Check className='h-4 w-4' />}
                All platforms
              </DropdownMenuRadioItem>
              {PLATFORM_OPTIONS.map((option) => (
                <DropdownMenuRadioItem
                  key={option}
                  value={option}
                  data-testid={`platform-option-${option}`}
                  className={menuItemStyles}
                >
                  {platform === option && <Check className='h-4 w-4' />}
                  {option}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' data-testid='sort-select' className={triggerStyles}>
              Sort: {selectedSortLabel ?? 'Default'}
              <ChevronDown className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='center' className='border-ink bg-panel-alt'>
            <DropdownMenuRadioGroup
              value={sort ?? ALL_VALUE}
              onValueChange={(value) => onSortChange(value === ALL_VALUE ? undefined : (value as GetGamesSort))}
            >
              <DropdownMenuRadioItem value={ALL_VALUE} data-testid='sort-option-default' className={menuItemStyles}>
                {sort === undefined && <Check className='h-4 w-4' />}
                Default
              </DropdownMenuRadioItem>
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  data-testid={`sort-option-${option.value}`}
                  className={menuItemStyles}
                >
                  {sort === option.value && <Check className='h-4 w-4' />}
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <button
        type='button'
        data-testid='clear-filters'
        onClick={handleClearFilters}
        className='font-mono text-sm text-primary hover:underline'
      >
        Clear filters
      </button>
    </div>
  )
}
