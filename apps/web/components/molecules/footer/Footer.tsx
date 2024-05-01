'use client'

import { useGlobalState } from '@/providers/store/GlobalStateContext'

import clsx from 'clsx'
import classes from './Footer.module.scss'

export const Footer = () => {
  const { state } = useGlobalState()

  const footerStyles = clsx(classes.footer, state.theme.mode === 'light' && classes.light)

  return (
    <footer className={footerStyles}>
      <span>Footer</span>
    </footer>
  )
}
