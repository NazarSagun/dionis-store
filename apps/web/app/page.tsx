'use client'

import { useState } from 'react'
import { useGetGames, useGetGamesTopDeals } from '@repo/dionis-api/src/dionis/default/default'
import { GameObject, GetGamesEdition, GetGamesPlatform, GetGamesSort } from '@repo/dionis-api/src/model'
import { Skeleton } from '@repo/ui'

import { Footer } from '@/components/footer/Footer'
import { MainNavigation } from '@/components/main-navigation/MainNavigation'
import { CartDrawer } from '@/modules/cart/presentation/cart-drawer/CartDrawer'
import { GamesList } from '@/modules/games/presentation/games-list/GamesList'
import { GamesPagination } from '@/modules/games/presentation/games-pagination/GamesPagination'
import { GamesToolbar } from '@/modules/games/presentation/games-toolbar/GamesToolbar'
import { TopDeals } from '@/modules/games/presentation/top-deals/TopDeals'

const containerStyles =
  'flex flex-1 min-h-[75vh] flex-col items-center justify-center px-4 sm:px-8 lg:px-[35px] pb-20 bg-[image:var(--light-background-color)]'

export default function Home() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState<string>()
  const [platform, setPlatform] = useState<GetGamesPlatform>()
  const [sort, setSort] = useState<GetGamesSort>()
  const [edition, setEdition] = useState<GetGamesEdition>()

  const { data, isLoading, isError } = useGetGames(page, { search, platform, sort, edition })
  const { data: topDeals } = useGetGamesTopDeals()

  const resetToFirstPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setPage(1)
      setter(value)
    }

  const handleClearFilters = () => {
    setPage(1)
    setSearch(undefined)
    setPlatform(undefined)
    setSort(undefined)
    setEdition(undefined)
  }

  return (
    <>
      <MainNavigation />
      <main className='flex-1'>
        <div className={containerStyles}>
          <div className='w-full pt-12'>
            <p className='font-mono text-xs font-bold uppercase tracking-wide text-primary'>
              Digital + Physical Game Marketplace
            </p>
            <h1 className='mt-2 font-display text-4xl font-bold text-foreground'>Find your next game.</h1>
          </div>
          <GamesToolbar
            platform={platform}
            sort={sort}
            edition={edition}
            onSearchChange={resetToFirstPage(setSearch)}
            onPlatformChange={resetToFirstPage(setPlatform)}
            onSortChange={resetToFirstPage(setSort)}
            onEditionChange={resetToFirstPage(setEdition)}
            onClearFilters={handleClearFilters}
          />
          <TopDeals games={topDeals ?? []} />
          {isLoading && (
            <div
              data-testid='games-skeleton'
              className='grid w-full grid-cols-2 gap-6 pt-16 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            >
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className='aspect-[3/4] w-full' />
              ))}
            </div>
          )}
          {!isLoading && data && (
            <>
              <div data-testid='game-library' className='w-full'>
                <h2 className='w-full pt-16 font-display text-2xl font-bold text-foreground'>All Games</h2>
                <div className='w-full pt-10'>
                  <GamesList gamesList={data.games as GameObject[]} />
                </div>
                <GamesPagination currentPage={page} totalPages={data.totalPages as number} onChange={setPage} />
              </div>
            </>
          )}
          {!isLoading && isError && <p className='pt-20'>Something went wrong loading games. Please try again.</p>}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
