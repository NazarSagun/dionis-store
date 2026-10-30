import { AiSearchFilters } from '../integration/repository'

import { EDITION_OPTIONS, GamesFilters, priceRangeLabel, SORT_OPTIONS } from './filters'

// AI search (.claude/specs/ai-search-spec.md). The API answers with values for
// the home page filters. Each value shows as a chip that reads like its toolbar
// menu, and that chip later turns into the menu.

export type AiFilterKey = 'search' | 'platform' | 'genre' | 'price' | 'sort' | 'edition'

export interface AiFilterChip {
  key: AiFilterKey
  label: string
}

export const AI_SEARCH_EXAMPLES = [
  { text: 'Co-op shooter on PS5 under €20', sets: 'Platform · Genre · Price' },
  { text: 'Best rated RPG on Switch', sets: 'Platform · Genre · Sort' },
  { text: "Collector's edition games, cheapest first", sets: 'Edition · Sort' },
]

export const MAX_AI_QUERY_LENGTH = 200

// The result replaces every current filter and starts at page 1.
export const toGamesFilters = (filters: AiSearchFilters = {}): GamesFilters => ({ page: 1, ...filters })

// In toolbar order, with the toolbar's own labels.
export function aiFilterChips(filters: AiSearchFilters = {}): AiFilterChip[] {
  const chips: Array<AiFilterChip | false> = [
    !!filters.search && { key: 'search', label: `Search: ${filters.search}` },
    !!filters.platform && { key: 'platform', label: `Platform: ${filters.platform}` },
    !!filters.genre && { key: 'genre', label: `Genre: ${filters.genre}` },
    (filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      key: 'price',
      label: `Price: ${priceRangeLabel(filters.minPrice, filters.maxPrice)}`,
    },
    !!filters.sort && {
      key: 'sort',
      label: `Sort: ${SORT_OPTIONS.find((option) => option.value === filters.sort)?.label}`,
    },
    !!filters.edition && {
      key: 'edition',
      label: `Edition: ${EDITION_OPTIONS.find((option) => option.value === filters.edition)?.label}`,
    },
  ]
  return chips.filter((chip): chip is AiFilterChip => !!chip)
}

// A chip and the toolbar control it lands on share this name during the
// flying transition (Feature 3).
export const aiTransitionName = (key: AiFilterKey) => `ai-filter-${key}`
