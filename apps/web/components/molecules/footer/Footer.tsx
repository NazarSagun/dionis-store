'use client'

import { useThemeState } from '@/providers/theme/ThemeContext'

import clsx from 'clsx'
import classes from './Footer.module.css'

export const Footer = () => {
  const { state } = useThemeState()

  const footerStyles = clsx(classes.footer, state.mode === 'light' ? classes.light : null)

  return (
    <footer className={footerStyles}>
      <span>Footer</span>
    </footer>
  )
}
