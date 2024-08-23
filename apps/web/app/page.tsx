'use client'

import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'
import { GamesList } from './components'
import { useGetGames } from '@repo/dionis-api/src/dionis/default/default'
import { useState } from 'react'
import { GamesArrayGamesItem } from '@repo/dionis-api/src/model'
import {
  Loader,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui'

export default function Home() {
  const [page, setPage] = useState(1)
  const { state } = useThemeState()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  const { data, isLoading, error, isError } = useGetGames(page)

  const countPageNumber = (page: number) => {
    const pageString = page + page.toString()
    return Number(pageString)
  }

  if (isLoading) {
    return (
      <div className={containerStyles}>
        <Loader />
      </div>
    )
  }

  if (data) {
    const pagesArray = Array.from({ length: data.totalPages as number }, (_, index) => index + 1)

    console.log(countPageNumber(page))

    return (
      <div className={containerStyles}>
        <GamesList gamesList={data.games as GamesArrayGamesItem[]} />
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  const isFirstPage = page === 1
                  setPage((prevState) => (isFirstPage ? prevState : prevState - 1))
                }}
              />
            </PaginationItem>
            {pagesArray.map((item, index) =>
              index <= pagesArray.length && index < countPageNumber(page) ? (
                <PaginationItem>
                  <PaginationLink isActive={page === item}>{item}</PaginationLink>
                </PaginationItem>
              ) : null
            )}
            <PaginationItem>
              <PaginationNext />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }
}
