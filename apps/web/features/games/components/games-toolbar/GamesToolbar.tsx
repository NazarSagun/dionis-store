import { useEffect, useRef } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
} from '@repo/ui'
import { GetGamesPlatform, GetGamesSort } from '@repo/dionis-api/src/model'

interface GamesToolbarProps {
  platform?: GetGamesPlatform
  sort?: GetGamesSort
  onSearchChange: (search: string) => void
  onPlatformChange: (platform?: GetGamesPlatform) => void
  onSortChange: (sort?: GetGamesSort) => void
}

const PLATFORM_OPTIONS = Object.values(GetGamesPlatform)

const SORT_OPTIONS: { value: GetGamesSort; label: string }[] = [
  { value: GetGamesSort.price_asc, label: 'Price: low to high' },
  { value: GetGamesSort.price_desc, label: 'Price: high to low' },
  { value: GetGamesSort.rating_desc, label: 'Rating: high to low' },
]

const SEARCH_DEBOUNCE_MS = 300
const ALL_VALUE = 'all'

const triggerStyles =
  'flex h-10 items-center gap-2 rounded-md border-2 border-neon-cyan bg-transparent px-4 font-mono text-sm font-bold uppercase text-neon-cyan outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan'

const menuItemStyles =
  'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 font-mono text-sm text-foreground outline-none focus:bg-neon-cyan focus:text-ink data-[state=checked]:font-bold'

export const GamesToolbar = ({ platform, sort, onSearchChange, onPlatformChange, onSortChange }: GamesToolbarProps) => {
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const handleSearchInput = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => onSearchChange(value), SEARCH_DEBOUNCE_MS)
  }

  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label

  return (
    <div data-testid='games-toolbar' className='flex w-full flex-wrap items-end justify-center gap-8 pt-20'>
      <div className='flex flex-col gap-2'>
        <label htmlFor='search' className='font-mono text-xs font-bold uppercase tracking-wide text-neon-cyan'>
          Search
        </label>
        <Input
          name='search'
          type='text'
          placeholder='Search games...'
          data-testid='search-input'
          onInputChange={handleSearchInput}
          className='mb-0 mt-0 w-72'
        />
      </div>
      <div className='flex items-center gap-4'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' data-testid='platform-filter' className={triggerStyles}>
              {platform ?? 'Platform'}
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
              {selectedSortLabel ?? 'Sort'}
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
    </div>
  )
}
