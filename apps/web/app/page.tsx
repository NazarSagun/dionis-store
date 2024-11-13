'use client'

import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'
import { GamesList } from './(shop)/components'
import { useGetGames } from '@repo/dionis-api/src/dionis/default/default'
import { useState } from 'react'
import { GameObject } from '@repo/dionis-api/src/model'
import { Loader, MainNavigation, Footer } from '@/ui'
import { GamesPagination } from './(shop)/components/gamesPagination'

export default function Home() {
  const [page, setPage] = useState(1)
  const { state } = useThemeState()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

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
        <main>
          <div className={containerStyles}>
            <GamesList gamesList={data.games as GameObject[]} />
            <GamesPagination
              currentPage={page}
              totalPages={data.totalPages as number}
              onChange={setPage}
            />
          </div>
        </main>
        <Footer />
      </>
    )
  }
}
