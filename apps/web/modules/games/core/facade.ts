'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { GamesFilters, parseGamesFilters, toQueryString } from '../domain/filters'

// The URL is the only store for the home page's filters. A dropdown or page
// change adds a history entry, so Back restores the previous filters. Search
// replaces the current entry, so typing does not add one per keystroke.
// Any filter change goes back to page 1.
export const useGamesFilters = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const filters = useMemo(() => parseGamesFilters(new URLSearchParams(searchParams.toString())), [searchParams])

  const navigate = useCallback(
    (next: GamesFilters, mode: 'push' | 'replace') =>
      router[mode](`${pathname}${toQueryString(next)}`, { scroll: false }),
    [pathname, router],
  )

  return {
    filters,
    setFilters: (patch: Partial<Omit<GamesFilters, 'page'>>) => navigate({ ...filters, ...patch, page: 1 }, 'push'),
    setSearch: (search: string) => navigate({ ...filters, search: search || undefined, page: 1 }, 'replace'),
    setPage: (page: number) => navigate({ ...filters, page }, 'push'),
    clearFilters: () => navigate({ page: 1 }, 'push'),
  }
}
