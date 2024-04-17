'use client'

import { useTheme } from '@/providers/theme/ThemeProvider'
import classes from './Footer.module.scss'
import clsx from 'clsx'

export const Footer = () => {
  const { theme } = useTheme()

  const footerStyles = clsx(classes.footer, theme === 'light' && classes.light)

  return (
    <footer className={footerStyles}>
      <span>Footer</span>
    </footer>
  )
}
