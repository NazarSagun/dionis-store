'use client'

import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'
import { GamesList } from './components'
import { useGetGames } from '@repo/dionis-api/src/dionis/default/default'
import { useState } from 'react'
import { GamesArray } from '@repo/dionis-api/src/model'
import { Loader } from '@/ui'

export default function Home() {
  const [page, setPage] = useState(1)
  const { state } = useThemeState()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  const { data, isLoading, error, isError } = useGetGames(page)

  if (isLoading) {
    return (
      <div className={containerStyles}>
        <Loader />
      </div>
    )
  }

  if (data) {
    return (
      <div className={containerStyles}>
        <GamesList gamesList={data as GamesArray} />
      </div>
    )
  }
}
