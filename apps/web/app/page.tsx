'use client'

import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'
import { GamesList } from '@/ui'

export default function Home() {
  const { state } = useThemeState()

  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  return (
    <div className={containerStyles}>
      <GamesList />
    </div>
  )
}
