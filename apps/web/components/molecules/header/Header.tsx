'use client'

import Image from 'next/image'
import Link from 'next/link'

import { ThemeIcon } from '@/components/atoms/theme-icon'
import { useThemeState } from '@/providers/theme/ThemeContext'

import clsx from 'clsx'
import classes from './Header.module.css'
import { Theme, ThemeActionType } from '@/providers/theme'

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
  {
    id: 3,
    label: 'Sign Up',
    link: '/signup',
  },
]

export const Navigation = () => {
  const { state, dispatch } = useThemeState()
  const mode = state.mode
  const headerStyles = clsx(classes.header, mode === 'light' ? classes.light : null)
  const localStorageTheme = mode === Theme.DARK ? Theme.LIGHT : Theme.DARK

  const changeBodyStyles = () => {
    const body = document.getElementById('body')
    if (mode === Theme.LIGHT && body) {
      body.classList.add('light')
    } else {
      body && body.classList.remove('light')
    }
  }

  return (
    <header className={headerStyles}>
      <div>
        <span>Dionis</span>
        <Image
          width={40}
          height={40}
          alt='logo'
          src={`/icons/logo.png`}
        />
      </div>
      <nav>
        <ThemeIcon
          onClick={() => {
            localStorage.setItem('theme', localStorageTheme)
            changeBodyStyles()
            dispatch({ type: ThemeActionType.TOGGLE_THEME })
          }}
        />
        <ul>
          {navigation.map((item) => (
            <Link
              href={item.link}
              key={item.id}
            >
              <li>{item.label}</li>
            </Link>
          ))}
        </ul>
      </nav>
    </header>
  )
}
