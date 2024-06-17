'use client'

import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'

import { useGetUsers } from '@repo/dionis-api/src/dionis/default/default'
import { Button } from '@/components/atoms'

export default function Home() {
  const { state } = useThemeState()

  const { refetch, data, isLoading, error } = useGetUsers({
    query: {
      enabled: false,
    },
  })

  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  if (isLoading) {
    return <div className={containerStyles}>Loading!</div>
  }

  return (
    <div className={containerStyles}>
      <Button onClick={() => refetch()}>Click</Button>
      {data?.map((item) => {
        return <div key={item.id}>{item.name}</div>
      })}
    </div>
  )
}
