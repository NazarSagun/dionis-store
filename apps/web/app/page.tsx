'use client'

import { Suspense } from 'react'
import { GameObject } from '@repo/dionis-api/src/model'
import { Skeleton } from '@repo/ui'

import { Footer } from '@/components/footer/Footer'
import { MainNavigation } from '@/components/main-navigation/MainNavigation'
import { CartDrawer } from '@/modules/cart/presentation/cart-drawer/CartDrawer'
import { useGamesFilters } from '@/modules/games/core/facade'
import { useGetGames, useGetGamesGenres, useGetGamesTopDeals } from '@/modules/games/integration/repository'
import { GamesEmpty } from '@/modules/games/presentation/games-empty/GamesEmpty'
import { GamesList } from '@/modules/games/presentation/games-list/GamesList'
import { GamesPagination } from '@/modules/games/presentation/games-pagination/GamesPagination'
import { GamesToolbar } from '@/modules/games/presentation/games-toolbar/GamesToolbar'
import { TopDeals } from '@/modules/games/presentation/top-deals/TopDeals'

const containerStyles =
  'flex flex-1 min-h-[75vh] flex-col items-center justify-center px-4 sm:px-8 lg:px-[35px] pb-20 bg-[image:var(--light-background-color)]'

// useSearchParams needs a Suspense boundary, or `next build` fails to
// prerender the page.
export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() {
  const { filters, setFilters, setSearch, setPage, clearFilters } = useGamesFilters()
  const { page, ...query } = filters

  const { data, isLoading, isError } = useGetGames(page, query)
  const { data: topDeals } = useGetGamesTopDeals()
  const { data: genres } = useGetGamesGenres()

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
            search={filters.search}
            platform={filters.platform}
            genre={filters.genre}
            genres={genres ?? []}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            sort={filters.sort}
            edition={filters.edition}
            onSearchChange={setSearch}
            onPlatformChange={(platform) => setFilters({ platform })}
            onGenreChange={(genre) => setFilters({ genre })}
            onPriceChange={(range) => setFilters({ minPrice: range?.minPrice, maxPrice: range?.maxPrice })}
            onSortChange={(sort) => setFilters({ sort })}
            onEditionChange={(edition) => setFilters({ edition })}
            onClearFilters={clearFilters}
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
                  {data.games?.length ? (
                    <GamesList gamesList={data.games as GameObject[]} />
                  ) : (
                    <GamesEmpty search={filters.search} onClearFilters={clearFilters} />
                  )}
                </div>
                {data.games?.length ? (
                  <GamesPagination currentPage={page} totalPages={data.totalPages as number} onChange={setPage} />
                ) : null}
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
