'use client'

import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'

import { useGetUsers } from '@repo/dionis-api/src/dionis/default/default'
import { useEffect } from 'react'

export default function Home() {
  const { state } = useThemeState()
  const { data, isLoading, error } = useGetUsers()

  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  if (isLoading) {
    return <div>Loading!</div>
  }

  if (error) {
    return <div>error!</div>
  }

  return (
    <div className={containerStyles}>
      {data?.map((item) => {
        return <div>{item}</div>
      })}
    </div>
  )
}
