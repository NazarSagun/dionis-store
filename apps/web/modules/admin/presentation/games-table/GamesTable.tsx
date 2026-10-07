'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Skeleton } from '@repo/ui'

import { adminButtonText, adminInput, adminLabel, adminPanel } from '../../domain/styles'
import { useGetGames } from '../../integration/repository'

const SEARCH_DEBOUNCE_MS = 300
const headerCell = 'px-6 py-3 text-left font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground'
const cell = 'px-6 py-4 font-sans text-sm text-foreground'
const numberCell = 'px-6 py-4 text-right font-mono text-sm tabular-nums text-foreground'

export const GamesTable = () => {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [typed, setTyped] = useState('')
  const [search, setSearch] = useState<string>()

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(typed.trim() || undefined)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [typed])

  const { data, isLoading, isError } = useGetGames(page, { search })
  const games = data?.games ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className='flex w-full flex-col gap-6'>
      <label className='flex w-full max-w-[360px] flex-col gap-2'>
        <span className={adminLabel}>Search by title</span>
        <input
          data-testid='admin-games-search'
          type='search'
          placeholder='Title contains…'
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          className={adminInput}
        />
      </label>

      <div className={`${adminPanel} w-full overflow-x-auto`}>
        <table data-testid='admin-games-table' className='w-full min-w-[760px] border-collapse'>
          <thead className='bg-panel-alt'>
            <tr>
              <th className={headerCell}>ID</th>
              <th className={headerCell}>Title</th>
              <th className={headerCell}>Platform</th>
              <th className={headerCell}>Genre</th>
              <th className={`${headerCell} text-right`}>Price</th>
              <th className={`${headerCell} text-right`}>Discount</th>
              <th className={`${headerCell} text-right`}>Editions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr
                key={game.id}
                data-testid='admin-game-row'
                onClick={() => router.push(`/admin/games/${game.id}`)}
                className='cursor-pointer border-t border-border hover:bg-panel-alt'
              >
                <td className='px-6 py-4 font-mono text-sm text-muted-foreground'>{game.id}</td>
                <td className={cell}>{game.title}</td>
                <td className={cell}>{game.platform}</td>
                <td className={cell}>{game.genre}</td>
                <td className={numberCell}>€{game.price}</td>
                <td className={numberCell}>{game.discount}%</td>
                <td className={numberCell}>{game.editionCount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <div className='flex flex-col gap-2 p-4'>
            {Array.from({ length: 6 }, (_, index) => index).map((index) => (
              <Skeleton key={index} className='h-10 w-full' />
            ))}
          </div>
        )}
        {!isLoading && !isError && games.length === 0 && (
          <p className='p-6 font-sans text-sm text-muted-foreground'>No games match this search.</p>
        )}
        {isError && (
          <p className='p-6 font-sans text-sm text-muted-foreground'>Could not load games. Please try again.</p>
        )}
      </div>

      <div className='flex items-center justify-between gap-4'>
        <span className='font-sans text-sm text-muted-foreground'>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <div className='flex gap-2'>
          <Button
            variant='secondary'
            className={adminButtonText}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant='secondary'
            className={adminButtonText}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
