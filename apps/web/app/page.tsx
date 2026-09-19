'use client'

import { useState } from 'react'
import { useGetGames, useGetGamesTopDeals } from '@repo/dionis-api/src/dionis/default/default'
import { GameObject, GetGamesPlatform, GetGamesSort } from '@repo/dionis-api/src/model'
import { Loader } from '@repo/ui'

import { Footer } from '@/components/footer'
import { MainNavigation } from '@/components/main-navigation'
import { GamesList, GamesPagination, GamesToolbar, TopDeals } from '@/features/games'
import { WishlistSection } from '@/features/wishlist'

const containerStyles =
  'flex flex-1 min-h-[75vh] flex-col items-center justify-center px-[35px] pb-20 bg-[image:var(--light-background-color)]'

export default function Home() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState<string>()
  const [platform, setPlatform] = useState<GetGamesPlatform>()
  const [sort, setSort] = useState<GetGamesSort>()

  const { data, isLoading, isError } = useGetGames(page, { search, platform, sort })
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
  }

  return (
    <>
      <MainNavigation />
      <main className='flex-1'>
        <div className={containerStyles}>
          <GamesToolbar
            platform={platform}
            sort={sort}
            onSearchChange={resetToFirstPage(setSearch)}
            onPlatformChange={resetToFirstPage(setPlatform)}
            onSortChange={resetToFirstPage(setSort)}
            onClearFilters={handleClearFilters}
          />
          <TopDeals games={topDeals ?? []} />
          <WishlistSection />
          {isLoading && <Loader />}
          {!isLoading && data && (
            <>
              <div data-testid='game-library' className='w-full'>
                <h2 className='w-full pt-16 text-center font-display text-xl uppercase text-neon-magenta'>
                  Game Library
                </h2>
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
    </>
  )
}
