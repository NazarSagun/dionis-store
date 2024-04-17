'use client'

import Link from 'next/link'
import clsx from 'clsx'

import { ThemeIcon } from '@/components/atoms/theme-icon'
import { useTheme } from '@/providers/theme/ThemeProvider'

import classes from './Header.module.scss'

const navigation = [
  {
    id: 1,
    label: 'Main',
    link: '/',
  },
  {
    id: 2,
    label: 'Login',
    link: '/login',
  },
]

export const Navigation = () => {
  const { toggleTheme, theme } = useTheme()

  const headerStyles = clsx(classes.header, theme === 'light' && classes.light)

  return (
    <header className={headerStyles}>
      <span>Site</span>
      <nav>
        <ul>
          <ThemeIcon theme={theme} onClick={toggleTheme} />
          {navigation.map((item) => (
            <Link href={item.label.toLowerCase()} key={item.id}>
              <li>{item.label}</li>
            </Link>
          ))}
        </ul>
      </nav>
    </header>
  )
}
