'use client'

import { useGetGame } from '@repo/dionis-api/src/dionis/default/default'
import classes from '../../page.module.css'
import clsx from 'clsx'
import { useThemeState } from '@/providers/theme'
import { Loader } from '@/ui'

export default function GamePage() {
  const { state } = useThemeState()

  const { data, isLoading, error, isError } = useGetGame(1)

  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  if (isLoading) {
    return (
      <div className={containerStyles}>
        <Loader />
      </div>
    )
  }

  if (data) {
    return <div className={containerStyles}>{data.title}</div>
  }
}
