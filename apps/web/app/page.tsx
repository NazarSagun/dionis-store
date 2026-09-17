'use client'

import { useState } from 'react'
import { useGetGames } from '@repo/dionis-api/src/dionis/default/default'
import { GameObject } from '@repo/dionis-api/src/model'
import { Loader } from '@repo/ui'

import { Footer } from '@/components/footer'
import { MainNavigation } from '@/components/main-navigation'
import { GamesList, GamesPagination } from '@/features/games'

const containerStyles =
  'flex flex-1 min-h-[75vh] flex-col items-center justify-center pb-20 bg-[image:var(--light-background-color)] dark:bg-[image:var(--dark-background-color)]'

export default function Home() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useGetGames(page)

  if (isLoading) {
    return (
      <main className={containerStyles}>
        <Loader />
      </main>
    )
  }

  if (data) {
    return (
      <>
        <MainNavigation />
        <main className='flex-1'>
          <div className={containerStyles}>
            <GamesList gamesList={data.games as GameObject[]} />
            <GamesPagination currentPage={page} totalPages={data.totalPages as number} onChange={setPage} />
          </div>
        </main>
        <Footer />
      </>
    )
  }
}
