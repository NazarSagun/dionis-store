import { GetGamesEdition, GetGamesPlatform, GetGamesSort } from '@repo/dionis-api/src/model'

// The home page's filters, as they live in the URL query string. A value the
// API would reject (an unknown platform, a non-numeric price) is dropped
// while parsing, so a hand-edited or stale link still shows games.

export interface GamesFilters {
  page: number
  search?: string
  platform?: GetGamesPlatform
  genre?: string
  sort?: GetGamesSort
  edition?: GetGamesEdition
  minPrice?: number
  maxPrice?: number
}

export interface PriceRange {
  key: string
  label: string
  minPrice?: number
  maxPrice?: number
}

export const PRICE_RANGES: PriceRange[] = [
  { key: 'up-to-15', label: 'Up to €15', maxPrice: 15 },
  { key: '15-30', label: '€15–€30', minPrice: 15, maxPrice: 30 },
  { key: '30-50', label: '€30–€50', minPrice: 30, maxPrice: 50 },
  { key: '50-plus', label: '€50 and up', minPrice: 50 },
]

const oneOf = <T extends string>(allowed: Record<string, T>, value: string | null) =>
  Object.values(allowed).find((option) => option === value)

const wholeNumber = (value: string | null) => {
  if (value === null || !/^\d+$/.test(value)) return undefined
  return Number(value)
}

const MAX_GENRE_LENGTH = 50
const MAX_SEARCH_LENGTH = 100

export function parseGamesFilters(params: URLSearchParams): GamesFilters {
  const search = params.get('search')?.slice(0, MAX_SEARCH_LENGTH) || undefined
  const genre = params.get('genre')
  const page = wholeNumber(params.get('page'))

  return {
    page: page && page > 0 ? page : 1,
    search,
    platform: oneOf(GetGamesPlatform, params.get('platform')),
    genre: genre && genre.length <= MAX_GENRE_LENGTH ? genre : undefined,
    sort: oneOf(GetGamesSort, params.get('sort')),
    edition: oneOf(GetGamesEdition, params.get('edition')),
    minPrice: wholeNumber(params.get('minPrice')),
    maxPrice: wholeNumber(params.get('maxPrice')),
  }
}

// Page 1 and empty values are left out, so the plain home page is "/".
export function toQueryString(filters: GamesFilters) {
  const params = new URLSearchParams()
  const entries: [string, string | number | undefined][] = [
    ['search', filters.search],
    ['platform', filters.platform],
    ['genre', filters.genre],
    ['minPrice', filters.minPrice],
    ['maxPrice', filters.maxPrice],
    ['sort', filters.sort],
    ['edition', filters.edition],
    ['page', filters.page > 1 ? filters.page : undefined],
  ]
  for (const [key, value] of entries) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function findPriceRange(minPrice?: number, maxPrice?: number) {
  return PRICE_RANGES.find((range) => range.minPrice === minPrice && range.maxPrice === maxPrice)
}

// Names a range that came from a hand-written link as well as a preset one.
export function priceRangeLabel(minPrice?: number, maxPrice?: number) {
  const preset = findPriceRange(minPrice, maxPrice)
  if (preset) return preset.label
  if (minPrice !== undefined && maxPrice !== undefined) return `€${minPrice}–€${maxPrice}`
  if (maxPrice !== undefined) return `Up to €${maxPrice}`
  if (minPrice !== undefined) return `€${minPrice} and up`
  return 'Any'
}
