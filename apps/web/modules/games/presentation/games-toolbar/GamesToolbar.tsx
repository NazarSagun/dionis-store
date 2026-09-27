import { useEffect, useRef, useState } from 'react'
import { GetGamesEdition, GetGamesPlatform, GetGamesSort } from '@repo/dionis-api/src/model'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@repo/ui'
import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'

import { findPriceRange, PRICE_RANGES, PriceRange, priceRangeLabel } from '../../domain/filters'

interface GamesToolbarProps {
  search?: string
  platform?: GetGamesPlatform
  genre?: string
  genres: { genre: string; count: number }[]
  minPrice?: number
  maxPrice?: number
  sort?: GetGamesSort
  edition?: GetGamesEdition
  onSearchChange: (search: string) => void
  onPlatformChange: (platform?: GetGamesPlatform) => void
  onGenreChange: (genre?: string) => void
  onPriceChange: (range?: PriceRange) => void
  onSortChange: (sort?: GetGamesSort) => void
  onEditionChange: (edition?: GetGamesEdition) => void
  onClearFilters: () => void
}

const PLATFORM_OPTIONS = Object.values(GetGamesPlatform)

const SORT_OPTIONS: { value: GetGamesSort; label: string }[] = [
  { value: GetGamesSort.price_asc, label: 'Price (low to high)' },
  { value: GetGamesSort.price_desc, label: 'Price (high to low)' },
  { value: GetGamesSort.rating_desc, label: 'Rating (high to low)' },
]

const EDITION_OPTIONS: { value: GetGamesEdition; label: string }[] = [
  { value: GetGamesEdition.digital, label: 'Digital' },
  { value: GetGamesEdition.standard, label: 'Standard' },
  { value: GetGamesEdition.collector, label: 'Collector' },
]

const SEARCH_DEBOUNCE_MS = 300
const ALL_VALUE = 'all'

const triggerStyles =
  'flex h-10 items-center gap-2 rounded-md border border-ink bg-secondary px-4 font-mono text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'

const menuItemStyles =
  'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 font-mono text-sm text-foreground outline-none focus:bg-neon-cyan focus:text-primary-foreground data-[state=checked]:font-bold'

export const GamesToolbar = ({
  search,
  platform,
  genre,
  genres,
  minPrice,
  maxPrice,
  sort,
  edition,
  onSearchChange,
  onPlatformChange,
  onGenreChange,
  onPriceChange,
  onSortChange,
  onEditionChange,
  onClearFilters,
}: GamesToolbarProps) => {
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()
  const [searchResetKey, setSearchResetKey] = useState(0)
  const lastTypedSearch = useRef(search ?? '')

  // The input keeps its own text. Remount it with the URL's search only when
  // that search changed from outside, e.g. after Back, never while typing.
  useEffect(() => {
    if ((search ?? '') === lastTypedSearch.current) return
    lastTypedSearch.current = search ?? ''
    setSearchResetKey((key) => key + 1)
  }, [search])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const handleSearchInput = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      lastTypedSearch.current = value
      onSearchChange(value)
    }, SEARCH_DEBOUNCE_MS)
  }

  const handleClearFilters = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setSearchResetKey((key) => key + 1)
    onClearFilters()
  }

  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label
  const selectedEditionLabel = EDITION_OPTIONS.find((option) => option.value === edition)?.label

  const platformRadioGroup = (
    <DropdownMenuRadioGroup
      value={platform ?? ALL_VALUE}
      onValueChange={(value) => onPlatformChange(value === ALL_VALUE ? undefined : (value as GetGamesPlatform))}
    >
      <DropdownMenuRadioItem value={ALL_VALUE} data-testid='platform-filter-option' className={menuItemStyles}>
        {platform === undefined && <Check className='h-4 w-4' />}
        All platforms
      </DropdownMenuRadioItem>
      {PLATFORM_OPTIONS.map((option) => (
        <DropdownMenuRadioItem
          key={option}
          value={option}
          data-testid='platform-filter-option'
          className={menuItemStyles}
        >
          {platform === option && <Check className='h-4 w-4' />}
          <span>{option}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )

  const genreRadioGroup = (
    <DropdownMenuRadioGroup
      value={genre ?? ALL_VALUE}
      onValueChange={(value) => onGenreChange(value === ALL_VALUE ? undefined : value)}
    >
      <DropdownMenuRadioItem value={ALL_VALUE} data-testid='genre-filter-option' className={menuItemStyles}>
        {genre === undefined && <Check className='h-4 w-4' />}
        All genres
      </DropdownMenuRadioItem>
      {genres.map((option) => (
        <DropdownMenuRadioItem
          key={option.genre}
          value={option.genre}
          data-testid='genre-filter-option'
          className={menuItemStyles}
        >
          {genre === option.genre && <Check className='h-4 w-4' />}
          <span>{option.genre}</span>
          <span className='ml-auto text-muted-foreground'>{option.count}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )

  const hasPrice = minPrice !== undefined || maxPrice !== undefined
  const selectedPriceKey = findPriceRange(minPrice, maxPrice)?.key

  const priceRadioGroup = (
    <DropdownMenuRadioGroup
      value={hasPrice ? (selectedPriceKey ?? 'custom') : ALL_VALUE}
      onValueChange={(value) => onPriceChange(PRICE_RANGES.find((range) => range.key === value))}
    >
      <DropdownMenuRadioItem value={ALL_VALUE} data-testid='price-filter-option' className={menuItemStyles}>
        {!hasPrice && <Check className='h-4 w-4' />}
        Any price
      </DropdownMenuRadioItem>
      {PRICE_RANGES.map((range) => (
        <DropdownMenuRadioItem
          key={range.key}
          value={range.key}
          data-testid='price-filter-option'
          className={menuItemStyles}
        >
          {selectedPriceKey === range.key && <Check className='h-4 w-4' />}
          <span>{range.label}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )

  const sortRadioGroup = (
    <DropdownMenuRadioGroup
      value={sort ?? ALL_VALUE}
      onValueChange={(value) => onSortChange(value === ALL_VALUE ? undefined : (value as GetGamesSort))}
    >
      <DropdownMenuRadioItem value={ALL_VALUE} data-testid='sort-option' className={menuItemStyles}>
        {sort === undefined && <Check className='h-4 w-4' />}
        Default
      </DropdownMenuRadioItem>
      {SORT_OPTIONS.map((option) => (
        <DropdownMenuRadioItem
          key={option.value}
          value={option.value}
          data-testid='sort-option'
          className={menuItemStyles}
        >
          {sort === option.value && <Check className='h-4 w-4' />}
          <span>{option.label}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )

  const editionRadioGroup = (
    <DropdownMenuRadioGroup
      value={edition ?? ALL_VALUE}
      onValueChange={(value) => onEditionChange(value === ALL_VALUE ? undefined : (value as GetGamesEdition))}
    >
      <DropdownMenuRadioItem value={ALL_VALUE} data-testid='edition-filter-option' className={menuItemStyles}>
        {edition === undefined && <Check className='h-4 w-4' />}
        All editions
      </DropdownMenuRadioItem>
      {EDITION_OPTIONS.map((option) => (
        <DropdownMenuRadioItem
          key={option.value}
          value={option.value}
          data-testid='edition-filter-option'
          className={menuItemStyles}
        >
          {edition === option.value && <Check className='h-4 w-4' />}
          <span>{option.label}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )

  return (
    <div data-testid='games-toolbar' className='flex w-full flex-wrap items-center gap-3 pt-8'>
      <Input
        key={searchResetKey}
        name='search'
        type='text'
        defaultValue={search}
        placeholder='Search by title...'
        data-testid='search-input'
        onInputChange={handleSearchInput}
        className='mb-0 mt-0 h-10 w-full bg-secondary px-4 sm:w-72'
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type='button' data-testid='filters-trigger' className={cn(triggerStyles, 'sm:hidden')}>
            <SlidersHorizontal className='h-4 w-4' />
            Filters
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-64 border-ink bg-panel-alt'>
          <DropdownMenuLabel>Platform</DropdownMenuLabel>
          {platformRadioGroup}
          <DropdownMenuSeparator className='bg-ink' />
          <DropdownMenuLabel>Genre</DropdownMenuLabel>
          {genreRadioGroup}
          <DropdownMenuSeparator className='bg-ink' />
          <DropdownMenuLabel>Price</DropdownMenuLabel>
          {priceRadioGroup}
          <DropdownMenuSeparator className='bg-ink' />
          <DropdownMenuLabel>Sort</DropdownMenuLabel>
          {sortRadioGroup}
          <DropdownMenuSeparator className='bg-ink' />
          <DropdownMenuLabel>Edition</DropdownMenuLabel>
          {editionRadioGroup}
          <DropdownMenuSeparator className='bg-ink' />
          <DropdownMenuItem data-testid='clear-filters-mobile' onClick={handleClearFilters} className={menuItemStyles}>
            Clear filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className='hidden flex-wrap items-center gap-3 sm:flex'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' data-testid='platform-filter' className={triggerStyles}>
              Platform: {platform ?? 'All'}
              <ChevronDown className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='center' className='border-ink bg-panel-alt'>
            {platformRadioGroup}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' data-testid='genre-filter' className={triggerStyles}>
              Genre: {genre ?? 'All'}
              <ChevronDown className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='center' className='max-h-80 overflow-y-auto border-ink bg-panel-alt'>
            {genreRadioGroup}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' data-testid='price-filter' className={triggerStyles}>
              Price: {priceRangeLabel(minPrice, maxPrice)}
              <ChevronDown className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='center' className='border-ink bg-panel-alt'>
            {priceRadioGroup}
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
            {sortRadioGroup}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' data-testid='edition-filter' className={triggerStyles}>
              Edition: {selectedEditionLabel ?? 'All'}
              <ChevronDown className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='center' className='border-ink bg-panel-alt'>
            {editionRadioGroup}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <button
        type='button'
        data-testid='clear-filters'
        onClick={handleClearFilters}
        className='hidden font-mono text-sm text-primary hover:underline sm:inline'
      >
        Clear filters
      </button>
    </div>
  )
}
